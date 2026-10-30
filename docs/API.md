# CampusCompass REST API

Base path: `/api`. Browser requests use credentials for the HTTP-only session cookie. JSON writes use `Content-Type: application/json`; image uploads send raw JPEG, PNG, or WebP bytes. Validation rejects unsupported properties.

## Authentication and account

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/google` | Public, rate-limited | Verify a Google ID token and create an HTTP-only session. |
| `GET /auth/me` | Authenticated | Return safe current-user fields. |
| `POST /auth/logout` | Public/session-clearing | Invalidate the user's session version and clear the session cookie. |
| `GET /account/profile` | Authenticated | Return own profile, review summaries and saved institutions. |

Suspended/deactivated accounts and stale session versions are rejected by authentication middleware on every protected request.

## Public institution data

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /institutions` | Public | Search/filter/paginate published institutions. Query: `q`, `type`, `country`, `state`, `city`, `facility`, `minRating`, `sort`, `page`, `limit`. |
| `GET /institutions/featured` | Public | Return a bounded set of published institutions. |
| `GET /institutions/compare?ids=id,id` | Public | Compare two or three published institutions. |
| `GET /institutions/:slug` | Public | Read one published institution. |
| `GET /institutions/:slug/reviews` | Public | Paginated approved reviews only; pending, rejected, flagged, hidden, and removed reviews are excluded in MongoDB queries. |
| `GET /categories?kind=institution|course` | Public | Return active category labels from the existing category collection; omit `kind` to list both kinds. |

Supported sort values are `rating_desc`, `reviews_desc`, `newest`, and `name_asc`.

## Reviews, reports, and favorites

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /reviews` | Authenticated, rate-limited | Submit one review per user/institution; status is server-set to `pending`. |
| `GET /reviews/mine` | Authenticated | List own reviews and moderation statuses without private moderator notes. |
| `POST /reviews/:id/attachments` | Owner, rate-limited | Upload an image to a pending review for moderation. |
| `POST /reports` | Authenticated, rate-limited | Report an approved review using a controlled reason; duplicate reports are rejected. |
| `GET /favorites` | Authenticated | List own saved institutions. |
| `POST /favorites/:institutionId` | Authenticated | Save a published institution. |
| `DELETE /favorites/:institutionId` | Authenticated | Remove own saved institution. |

Review moderation actions use `POST /admin/reviews/:id/moderation` with `approve`, `reject`, `flag`, `hide`, or `remove`. Review and institution rating aggregates are recomputed inside the same transaction for approval/removal transitions.

## Administrator APIs

Every `/admin/*` route requires an active session and a database-backed `admin` role. Write operations have an administrator rate limit.

| Method and path | Purpose |
| --- | --- |
| `GET /admin/session` | Check admin access. |
| `GET /admin/dashboard` / `GET /admin/analytics` | Live MongoDB counts, averages, trends, distributions, and recent records. |
| `GET, POST /admin/institutions` | Search/list all institution statuses or create a draft. |
| `GET, PATCH, DELETE /admin/institutions/:id` | Read/edit a listing or confirmed deletion when no reviews/favorites depend on it. |
| `POST /admin/institutions/:id/publish`, `/unpublish`, `/archive` | Change publication state; publishing validates minimum content. |
| `POST, DELETE /admin/institutions/:id/media` | Upload/delete institution, facility, faculty, logo, cover, and gallery media through server-side Cloudinary credentials. |
| `GET /admin/reviews` / `GET /admin/reviews/:id` | Review queue and private moderation detail. |
| `POST /admin/reviews/:id/moderation` | Moderate a review; requires a reason for non-approval actions. |
| `GET /admin/reviews/:id/moderation-history` | Read audit history. |
| `GET /admin/users` / `GET /admin/users/:id` | Search users and view their review history. |
| `PATCH /admin/users/:id/status` / `PATCH /admin/users/:id/role` | Suspend/reactivate/deactivate accounts or change roles, with self/last-admin protections. |
| `GET /admin/reports` / `POST /admin/reports/:id/resolve` | Inspect, resolve, dismiss, or remove reported content. |
| `GET, POST /admin/categories` / `PATCH, DELETE /admin/categories/:id` | Manage institution/course categories. |
| `GET /admin/activity-logs` | Paginated admin audit log. |

Admin bootstrap is an explicit server-side command: set `INITIAL_ADMIN_EMAIL` to an existing Google-authenticated account, then run `npm run bootstrap:admin` from `backend/`.

## Health and common status codes

`GET /health` reports database readiness without credentials or connection details. Typical responses: `200` success, `201` created, `400` invalid input, `401` unauthenticated, `403` unauthorized role, `404` unavailable resource, `409` duplicate or invalid state transition, `413` oversized upload, `415` unsupported media, and `429` rate limit.
