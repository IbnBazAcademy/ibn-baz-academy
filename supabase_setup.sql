-- IBN BĀZ ACADEMY: Supabase database setup
-- Run this script in Supabase SQL Editor for a fresh project.
-- Never expose the Supabase service_role key in browser code.

create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_amount numeric(12,2) not null default 0 check (price_amount >= 0),
  price_label text not null default 'Free',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending_payment'
    check (status in ('active','pending_payment','pending_approval','rejected')),
  created_at timestamptz not null default now(),
  unique(student_id, course_id)
);

alter table public.student_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

-- Helper function: admin status is checked from the protected profile table.
create or replace function public.is_academy_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.student_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Student profile access
drop policy if exists "Students view own profile or admin views all" on public.student_profiles;
create policy "Students view own profile or admin views all"
on public.student_profiles for select
using (auth.uid() = id or public.is_academy_admin());

drop policy if exists "Students update own name only" on public.student_profiles;
create policy "Students update own name only"
on public.student_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and role = 'student');

-- Students can read published courses; admins can manage all courses.
drop policy if exists "Published courses visible to students" on public.courses;
create policy "Published courses visible to students"
on public.courses for select
using (is_published = true or public.is_academy_admin());

drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses"
on public.courses for all
using (public.is_academy_admin())
with check (public.is_academy_admin());

-- Enrolments: students see their own; admins can see/manage all.
drop policy if exists "Students see own enrolments or admin sees all" on public.enrollments;
create policy "Students see own enrolments or admin sees all"
on public.enrollments for select
using (student_id = auth.uid() or public.is_academy_admin());

drop policy if exists "Students request own enrolment" on public.enrollments;
create policy "Students request own enrolment"
on public.enrollments for insert
with check (student_id = auth.uid());

drop policy if exists "Admins update enrolments" on public.enrollments;
create policy "Admins update enrolments"
on public.enrollments for update
using (public.is_academy_admin())
with check (public.is_academy_admin());

-- Determine access on the server: free course => active immediately;
-- paid course => pending_payment until an admin verifies payment and approves.
create or replace function public.set_initial_enrollment_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare course_price numeric(12,2);
begin
  select price_amount into course_price
  from public.courses where id = new.course_id and is_published = true;
  if not found then
    raise exception 'This course is not currently open for enrolment.';
  end if;
  if course_price = 0 then
    new.status := 'active';
  else
    new.status := 'pending_payment';
  end if;
  return new;
end;
$$;

drop trigger if exists before_enrollment_insert on public.enrollments;
create trigger before_enrollment_insert
before insert on public.enrollments
for each row execute procedure public.set_initial_enrollment_status();

-- Automatically create a student profile when a new auth account is registered.
create or replace function public.handle_new_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.student_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_student();

-- Starter programmes. You can edit these descriptions/prices in the SQL editor.
insert into public.courses (title, description, price_amount, price_label, is_published)
select 'Qur’an Memorisation', 'Build a consistent memorisation routine with guided learning and revision.', 0, 'Free', true
where not exists (select 1 from public.courses where title = 'Qur’an Memorisation');

insert into public.courses (title, description, price_amount, price_label, is_published)
select 'Tajweed & Recitation', 'Strengthen your recitation through guided study of Tajweed principles.', 0, 'Free', true
where not exists (select 1 from public.courses where title = 'Tajweed & Recitation');

insert into public.courses (title, description, price_amount, price_label, is_published)
select 'Special Study Classes', 'Focused paid programmes announced by Ibn Bāz Academy. Contact the academy for current fees.', 1, 'Fee confirmed by academy', true
where not exists (select 1 from public.courses where title = 'Special Study Classes');

-- IMPORTANT ADMIN SETUP:
-- 1) Register your own account through auth.html.
-- 2) Find your user UUID in Supabase Authentication > Users.
-- 3) Run this statement with your UUID to grant admin access:
-- update public.student_profiles set role = 'admin' where id = 'YOUR-USER-UUID';
-- Do not let students choose or edit their own role.
