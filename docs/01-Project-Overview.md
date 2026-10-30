# 01 — Project overview

CampusCompass helps people find and compare schools, colleges and universities. People can create an account with Google, save institutions, and submit reviews. A review is private while it is waiting for an administrator. Only approved reviews affect public ratings.

## The parts of the application

- **Frontend:** `frontend/` contains the React website. Vite serves it during development, usually at `http://localhost:5174`.
- **Backend:** `backend/` contains the Express API. It normally listens at `http://localhost:5000`.
- **Database:** MongoDB Atlas stores user, institution, review, report, favorite and audit records. Mongoose checks and reads those records.
- **Google sign-in:** the browser gets a Google credential and sends it to the backend. The backend verifies it and creates an HTTP-only cookie.
- **Cloudinary:** image uploads pass through the backend. The Cloudinary API secret stays in `backend/.env`.

## How a normal visit works

1. The browser loads the React site.
2. React calls the Express API using `VITE_API_BASE_URL`.
3. Public API requests read published MongoDB records.
4. Sign-in uses an HTTP-only cookie. The browser sends that cookie with API requests.
5. The backend checks the current user and their database role before private or administrator operations.

## Existing records and data layout

The project already has Mongoose models for users, institutions, reviews, reports, favorites, categories, moderation logs and administrator roster records. Courses, faculties, facilities, fees and admission details are embedded in an institution record. This keeps the current model simple and avoids unnecessary new collections.

Adding a field to a Mongoose model does not require deleting or recreating the collection. The institution verification status added in this phase defaults to `unverified` for records that do not yet have a value. No existing data is intentionally reset by the application.

## Main screens

- `/` — home page.
- `/institutions` — search and browse published institutions.
- `/institutions/:slug` — one institution and its approved reviews.
- `/compare` — compare two or three saved institutions.
- `/review` — signed-in user review form.
- `/profile` — signed-in profile, own review statuses and saved institutions.
- `/admin` — administrator dashboard, with linked management pages.

## Roles and review privacy

Every new account begins as a normal user. An administrator must be explicitly provisioned. The backend checks the role for every admin API request; hiding an admin link in React is not the security boundary. Public review endpoints query approved reviews only. Internal moderation notes are not returned by public APIs.

## Technology and scripts

The backend requires Node.js 20 or newer. Use Node.js 22.12 or newer for the current Vite version. Package scripts are documented in [Starting the application](05-Starting-the-Application.md). The root repository does not need to be recreated or scaffolded.
