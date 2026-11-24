import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const SUPABASE_URL = "https://tjcqsnuxnokyimjyveql.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_obh6XrD2TeNqsiI7wSK3WA_QlCVMp2l";
const notice = document.getElementById("notice");
const myCourses = document.getElementById("myCourses");
const availableCourses = document.getElementById("availableCourses");

function showNotice(text, error=false) {
  notice.textContent = text;
  notice.classList.toggle("error", error);
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function statusLabel(status) {
  const labels = {active:"Enrolled",pending_payment:"Awaiting payment",pending_approval:"Awaiting approval",rejected:"Not approved"};
  return labels[status] || status.replaceAll("_"," ");
}
function courseCard(course, enrollment, enrolledIds) {
  const isFree = Number(course.price_amount || 0) === 0;
  const status = enrollment?.status;
  let action = "";
  if (status === "active") action = `<span class="status">You are enrolled</span>`;
  else if (status) action = `<span class="status ${status === "pending_payment" ? "pending" : "waiting"}">${escapeHtml(statusLabel(status))}</span>`;
  else action = `<button class="course-action" data-course-id="${escapeHtml(course.id)}">${isFree ? "Enrol for free" : "Request paid enrolment"}</button>`;
  return `<article class="course-tile">
    <div class="tile-meta"><span class="course-type">${isFree ? "Free programme" : "Paid programme"}</span><span class="course-type">${isFree ? "No fee" : escapeHtml(course.price_label || "Fee announced by academy")}</span></div>
    <h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description || "Course details will be shared by the academy.")}</p>${action}
  </article>`;
}

if (SUPABASE_URL.startsWith("YOUR_") || SUPABASE_ANON_KEY.startsWith("YOUR_")) {
  document.getElementById("studentName").textContent = "student.";
  myCourses.innerHTML = '<p class="empty-text">The student portal is designed. Connect the Supabase project to load course enrolments.</p>';
  availableCourses.innerHTML = '<p class="empty-text">Connect Supabase and add programmes to display them here.</p>';
  showNotice("Account access is not active until the academy connects its Supabase project.", true);
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) window.location.replace("auth.html");
  else {
    const user = session.user;
    document.getElementById("studentName").textContent =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "student.";
    async function loadPortal() {
      const [{data: courses, error: courseError}, {data: enrolments, error: enrolError}] = await Promise.all([
        supabase.from("courses").select("id,title,description,price_amount,price_label,is_published").eq("is_published", true).order("created_at", {ascending:false}),
        supabase.from("enrollments").select("id,course_id,status").eq("student_id", user.id)
      ]);
      if (courseError || enrolError) {
        showNotice("We could not load your courses. Please check the academy database setup.", true);
        myCourses.innerHTML = '<p class="empty-text">Course information is temporarily unavailable.</p>';
        availableCourses.innerHTML = "";
        return;
      }
      const enrolled = enrolments || [];
      const enrolledIds = new Set(enrolled.map(e => e.course_id));
      document.getElementById("enrolmentCount").textContent = `${enrolled.length} enrolment${enrolled.length === 1 ? "" : "s"}`;
      const active = enrolled.filter(e => e.status === "active");
      myCourses.innerHTML = active.length
        ? active.map(e => courseCard(courses.find(c => c.id === e.course_id) || {title:"Course",description:""}, e, enrolledIds)).join("")
        : '<p class="empty-text">You have no active courses yet. Browse the available programmes below.</p>';
      const nonActive = enrolled.filter(e => e.status !== "active");
      if (nonActive.length) {
        myCourses.insertAdjacentHTML("beforeend", nonActive.map(e => {
          const c = courses.find(x => x.id === e.course_id) || {title:"Course",description:""};
          return `<article class="course-tile"><div class="tile-meta"><span class="course-type">Enrolment update</span><span class="status ${e.status === "pending_payment" ? "pending" : "waiting"}">${escapeHtml(statusLabel(e.status))}</span></div><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.description || "")}</p></article>`;
        }).join(""));
      }
      availableCourses.innerHTML = courses?.length
        ? courses.map(c => courseCard(c, enrolled.find(e => e.course_id === c.id), enrolledIds)).join("")
        : '<p class="empty-text">No programmes are open for registration right now. Please check again later.</p>';
      availableCourses.querySelectorAll("[data-course-id]").forEach(button => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          const {error} = await supabase.from("enrollments").insert({student_id:user.id, course_id:button.dataset.courseId});
          if (error) showNotice(error.code === "23505" ? "You have already requested this course." : error.message, true);
          else showNotice("Your enrolment request has been recorded. Check the status in My courses.");
          await loadPortal();
        });
      });
    }
    await loadPortal();
  }
  document.getElementById("logoutButton").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.replace("auth.html");
  });
}
