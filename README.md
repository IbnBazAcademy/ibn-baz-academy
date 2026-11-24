# Ibn Bāz Academy Website — Starter Version

This is the first responsive front-end version of the Ibn Bāz Academy website.

## Files
- `index.html` — page content and structure
- `styles.css` — colours, layout, typography and responsive styling
- `script.js` — mobile navigation and automatic footer year

## Preview locally
1. Download and extract the ZIP.
2. Open the `ibn_baz_academy_website` folder.
3. Open `index.html` in a web browser.

You can also edit the files using Visual Studio Code.

## Before publishing
Please review and confirm:
- Exact academy description and mission
- Which courses are currently open
- Course fees and schedules
- Tutor names and biographies
- Official email/social links
- Whether the WhatsApp registration number is still correct

## Current scope
This is a static front-end starter. It does not yet store registrations or provide student/admin accounts. Those require a backend/database and will be a later development step.


## Student accounts (new starter pages)
- `auth.html` — create-account and login interface
- `auth.js` — Supabase email/password authentication (requires project settings)
- `dashboard.html` / `dashboard.js` — protected student dashboard starter
- `auth.css` — account page styling
- `supabase_setup.sql` — profile table, row-level security and account profile trigger

### Activate accounts
1. Create a Supabase project at https://supabase.com/.
2. In Project Settings → API, copy the Project URL and anon/public key.
3. Replace the two placeholders in both `auth.js` and `dashboard.js`.
4. In Supabase SQL Editor, run `supabase_setup.sql`.
5. In Supabase Authentication settings, configure the site URL and email confirmation settings.
6. Host the website on a static host that serves the files over HTTPS.

Important: the account pages are a backend-ready starter, not a live account system until Supabase is configured. Only use the anon/public key in browser code. Never expose a Supabase service-role key. The dashboard is currently a basic signed-in landing page; course enrolment, admin approval and management features are future steps.


## Version 3: student portal and course access rules
- Students can create accounts and log in using Supabase Auth.
- Free published courses: enrolment activates immediately.
- Paid published courses: enrolment is recorded as `pending_payment`; no course access is granted until the academy verifies payment and changes the status to `active`.
- Students can see their own enrolment statuses.
- Admins can manage courses and enrolments through Supabase policies; a visual admin dashboard is a later build step.

### Database setup
1. Create a Supabase project.
2. Put the Project URL and anon/public key into `auth.js` and `dashboard.js`.
3. Run the complete `supabase_setup.sql` in Supabase SQL Editor.
4. Register the academy owner account, then use the SQL comment at the end of the script to set that profile's role to `admin`.
5. In Supabase Authentication URL settings, set the deployed website URL and enable/configure email confirmation.
6. Deploy all site files to an HTTPS static host.

### Important notes
- The sample paid course has a placeholder price of 1 only to classify it as paid. Set the real course fee before publishing enrolment.
- This version records paid enrolment requests but does not collect money online. Payment gateway integration and admin payment verification should be added before accepting real payments.
- The student portal is a front-end starter until Supabase is configured and deployed.
