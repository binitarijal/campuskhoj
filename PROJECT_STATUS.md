# CampusCompass — Project status

Last updated: 2026-10-30

## Current state

CampusCompass remains the existing React/Vite + Express/Mongoose project. The public site, Google session authentication, public institution APIs, reviews/favorites, admin APIs and admin pages are present. This pass added the missing additive institution verification field, a public categories endpoint, separate live school/college/university dashboard counts, fixed stale footer navigation/copy and review status labels, and wrote the requested beginner guides. No collection was dropped, no existing record was reset, and no private credential was copied to frontend source.

The project is **not yet certified as a complete end-to-end product**. A standalone backend run returned connected across health checks spanning about 157 seconds, then logged a MongoDB `ETIMEOUT` and scheduled a retry. This points to intermittent Atlas/network reachability; stable long-running connectivity is not certified. The integration suite stalled before its first assertion. Actual Google browser sign-in, admin workflow and Cloudinary upload were not completed here.

## Implemented areas

- Models exist for users, institutions, reviews, reports, favorites, categories, moderation logs and admin roster records. Courses, facilities, faculty profiles, admissions, fees and image references are embedded in institutions.
- Institution records have a separate publication status and verification status. `verificationStatus` is additive and defaults to `unverified` for old records; no data migration or deletion was run.
- Google sign-in verifies the ID token on the backend. The app uses an HTTP-only cookie; logout increments the user's session version. Protected requests check account status/session version and administrator role.
- Public APIs provide institution list/search/filter/sort/pagination, featured records, comparison, detail, approved reviews, active categories, review submission/status, reports and favorites.
- Admin APIs provide dashboard statistics, institution CRUD/publication/media management, review moderation/history, user management, report resolution, category management and activity logs.
- Public review queries include approved records only. Moderation uses a transaction and recalculates ratings from approved reviews. Duplicate approval is rejected.
- The frontend uses backend APIs for its public pages and admin pages. The editor supports institution details, courses, facilities, faculty, fees/admissions and Cloudinary assets.
- `backend/.env.example` and `frontend/.env.example` contain placeholders only. Existing Vite config reads only public `VITE_` variables from `backend/.env`, and the API URL has a local default, so a separate `frontend/.env` is not required.
- `docs/README.md` and beginner guides `docs/01-Project-Overview.md` through `docs/17-FAQ.md` now cover local setup, database, admin/user workflows, troubleshooting, deployment and backup.

## Checks actually run

- Frontend `npm run build`: **passed** after the changes.
- Frontend `npm run lint`: **completed with 14 warnings and no lint errors**. Warnings concern state updates from loading effects and one helper exported with components.
- Backend `npm run check`: **passed**.
- `node --check` over backend JavaScript source files: **passed** before the final safe backend logging adjustment; `npm.cmd run check` passed after it.
- `GET /health`: **HTTP 200, database connected across checks spanning about 157 seconds**. The backend later logged `ETIMEOUT` and scheduled a retry; long-duration stability is not certified.
- `OPTIONS /api/auth/google` from `http://localhost:5174`: **204**, correct `Access-Control-Allow-Origin`, and `Access-Control-Allow-Credentials: true`.
- `GET /api/categories`: **HTTP 200** against the live API.
- Unauthenticated admin-session request: rejected with `UNAUTHENTICATED`.
- Backend `npm test`: **not passed**. It printed the TAP header but did not reach an assertion for about 55 seconds; it was interrupted. It targets a uniquely named disposable database, not the existing database name.
- Google OAuth browser login: **not tested in this pass**.
- Cloudinary upload/delete: **not tested**; earlier external upload probe was blocked by sandbox network access before an asset was created.
- Full administrator CRUD/moderation/user/report workflows and responsive browser/device behavior: **not manually tested**.

The frontend build and syntax checks do not replace these outstanding integration checks. See [the detailed audit](docs/Implementation-Audit.md).

## Remaining limitations and work

1. Diagnose why the isolated MongoDB test handshake stalls and why the local backend later needed to retry its Atlas connection.
2. Run API integration tests on a disposable non-production database and confirm assertions for visibility, ratings, reports, suspension and authorization.
3. Sign in with the intended administrator and manually test institution CRUD, publication, image operations and moderation against the real backend.
4. Complete Cloudinary upload and deletion tests with the configured account.
5. Test Google login, refresh persistence and logout in a browser using the configured OAuth origin.
6. Review mobile layout, keyboard navigation and contrast; resolve lint warnings where practical.
7. The admin Settings screen is informational only. Institution course categories are still entered as text even though the catalog endpoint is available.
8. `frontend/src/data/institutions.js` is old, currently unused sample data. It remains in place and is not used by the current API-backed pages.

## Safe local startup

In PowerShell, use two terminals. In the first run `cd backend`, `npm.cmd install`, then `npm.cmd run dev`. In the second run `cd frontend`, `npm.cmd install`, then `npm.cmd run dev`. (On macOS/Linux use `npm` instead of `npm.cmd`.) Check `http://localhost:5000/health` before using database features. Vite defaults to `http://localhost:5173` and may choose `5174` if the default is busy; use the URL it prints.

Do not run the integration test against production. It creates a uniquely named disposable database and drops that database during cleanup. For details see [docs/05-Starting-the-Application.md](docs/05-Starting-the-Application.md) and [docs/16-Backup-and-Restore.md](docs/16-Backup-and-Restore.md).
