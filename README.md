# XcelLearn V3

XcelLearn is a role-based learning management platform for students, lecturers,
and administrators. This V3 handoff keeps the existing Next.js App Router
stack and adds an isolated demo site at `/demo`.

## What changed in V3

- The original site remains on its existing routes:
  - `/login`
  - `/admin/...`
  - `/student/...`
  - `/lecturer/...`
- The demo site has its own entry point:
  - `/demo`
  - `/demo/login`
  - `/demo/admin/...`
  - `/demo/student/...`
  - `/demo/lecturer/...`
- Demo sessions use a separate browser-storage key from the original site.
  Logging into `/demo` cannot create a session for the original site.
- Demo account requests and the demo administrator's approval setting are also
  stored in the browser and remain separate from any future live data layer.
- The main demo administrator is now exactly:
  - Username: `xeadmin`
  - Password: `XE2407`
- The demo login page includes buttons that fill the demo credentials for a
  presentation.
- The original `/login` page does not expose demo accounts and continues to
  show the live-auth integration message until a real identity provider is
  connected.

## Stack

- Next.js 15
- React 19
- TypeScript
- Next.js App Router
- `lucide-react`
- pnpm

The project was intentionally not converted to another framework or rewritten
as a separate application.

## Run locally

Requirements:

- Node.js 20 or newer
- pnpm 10 or newer

From the project directory:

```bash
pnpm install
pnpm dev
```

Open:

- Original site: <http://localhost:3000/login>
- Isolated demo: <http://localhost:3000/demo>

Useful checks:

```bash
pnpm typecheck
pnpm build
pnpm start
```

## Demo credentials

These credentials are for the local/private demo experience only. They are
hard-coded preview identities and must not be used for real users or real
student records.

| Role | Username | Password |
| --- | --- | --- |
| XE administrator | `xeadmin` | `XE2407` |
| Demo student | `stud.demo` | `123` |
| Demo student 2 | `student2` | `123` |
| Demo lecturer | `lect.demo` | `123` |
| Demo lecturer 2 | `lect2` | `123` |

Use the administrator account to review demo account requests at:

```text
/demo/admin/notifications
```

The seeded account requests are:

- Maya Williams — student — pending
- Dr. Daniel Mensah — lecturer — pending

The demo admin can approve or reject one request, select multiple requests,
and enable automatic acceptance under `/demo/admin/settings`.

## How the two site experiences work

### Original site

The original site starts at `/login`. It intentionally does not use the demo
credentials. Its login and registration screen is an integration seam for the
future production identity provider. Until that provider is connected, it
shows a safe message instead of pretending that live authentication works.

When production authentication is added, keep the live session, profiles,
roles, and all persisted application data on this side of the route split.
Do not reuse the demo browser-storage keys for production sessions.

### Demo site

The demo starts at `/demo`. The catch-all App Router page detects the `/demo`
prefix and renders the same role-based product experience beneath that prefix.
For example:

```text
/demo/login
/demo/admin/dashboard
/demo/student/assignments
/demo/lecturer/submissions
```

The demo uses seeded data and browser storage so a presenter can:

- Sign in as the administrator, student, or lecturer
- Navigate every role's dashboard and supporting screens
- Submit a demo account request
- Approve or reject account requests
- Turn automatic request acceptance on or off
- Filter assignments and open assignment/quiz interactions
- Mark notifications as read
- Edit a profile in the current browser session

To reset the demo in a browser, open the browser developer console and run:

```js
localStorage.removeItem("xcellearn_demo_user");
localStorage.removeItem("xcellearn_account_requests");
localStorage.removeItem("xcellearn_auto_accept");
location.href = "/demo";
```

The demo is intentionally client-only. Browser storage is not authentication,
does not protect data, and must not be used for production.

## Production setup checklist

The current repository is a polished frontend prototype with a safe,
isolated demo mode. It is not yet a production authentication or persistence
system. Before inviting real users:

- [ ] Choose and connect a production identity provider.
- [ ] Replace the `/login` preview handler with provider-backed sign-in,
      sign-out, registration, and password reset.
- [ ] Store the authenticated user profile and role server-side.
- [ ] Enforce role access on the server, not only in client navigation.
- [ ] Add a database for users, profiles, faculties, departments, courses,
      enrollments, assignments, quizzes, submissions, grades, resources, and
      notifications.
- [ ] Add server-side validation and authorization for every write.
- [ ] Add secure file storage for course resources and submission files.
- [ ] Add error reporting, audit logs, rate limiting, and production logging.
- [ ] Add automated tests for authentication, authorization, CRUD, grading,
      uploads, and notification read state.
- [ ] Test refreshes, expired sessions, denied access, empty states, loading
      states, mobile layouts, and browser back/forward behavior.
- [ ] Review privacy, retention, accessibility, education-record, and
      consent requirements before onboarding learners.
- [ ] Keep the demo route private or remove it before exposing real student
      data publicly.

## Environment variables

Create `.env.local` for local development from `.env.example` and never commit
it:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The production `/login` route now uses Supabase Auth email/password sign-in,
sign-up, session restoration, auth-state changes, and sign-out. In Supabase,
configure the site URL and redirect URLs to include your deployed origin and
`http://localhost:3000` for local development. Email confirmation can remain
enabled; new users will be asked to confirm their email before signing in.

The sign-up form stores the display name, username, role, department, pending
status, and verification flag in Auth user metadata. For production data and
authorization, mirror these fields into a protected `profiles` table and use
Row Level Security policies based on `auth.uid()`; do not use the anon key for
privileged server operations and never place a service-role key in a
`NEXT_PUBLIC_*` variable.

## Deployment notes

This remains a standard Next.js application:

1. Push this folder to a Git repository.
2. Import it into the deployment provider with the framework set to Next.js.
3. Use the default Next.js build output.
4. Add the real production environment variables.
5. Deploy a private preview first.
6. Verify that `/login` and `/demo` stay separate.
7. Configure the final domain and authentication callback URLs.
8. Keep demo credentials and seeded demo data away from production data.

The project has no custom server and does not require a framework adapter.

## Route map

### Original

- `/login` — live authentication entry point
- `/admin/dashboard` — administration overview
- `/admin/users` — user management
- `/admin/departments` — department management
- `/admin/faculties` — faculty management
- `/admin/courses` — course management
- `/admin/assignments` — assignment overview
- `/admin/activity` — platform activity
- `/admin/notifications` — account requests
- `/admin/settings` — administrator settings
- `/student/dashboard` — student overview
- `/student/assignments` — student coursework
- `/student/library` — course resources
- `/student/profile` — student profile
- `/student/notifications` — student notifications
- `/lecturer/dashboard` — lecturer overview
- `/lecturer/assignments` — lecturer assignments
- `/lecturer/submissions` — submissions to review
- `/lecturer/profile` — lecturer profile
- `/lecturer/notifications` — lecturer notifications

### Demo

The same authenticated role routes are available with `/demo` prefixed:

- `/demo`
- `/demo/login`
- `/demo/admin/dashboard`
- `/demo/admin/users`
- `/demo/admin/departments`
- `/demo/admin/faculties`
- `/demo/admin/courses`
- `/demo/admin/assignments`
- `/demo/admin/activity`
- `/demo/admin/notifications`
- `/demo/admin/settings`
- `/demo/student/dashboard`
- `/demo/student/assignments`
- `/demo/student/library`
- `/demo/student/profile`
- `/demo/student/notifications`
- `/demo/lecturer/dashboard`
- `/demo/lecturer/assignments`
- `/demo/lecturer/submissions`
- `/demo/lecturer/profile`
- `/demo/lecturer/notifications`

## Brand and licensing

The product is branded as XcelLearn by XEStudioz. Add the appropriate license,
privacy policy, terms of use, and third-party asset attributions before public
launch.