# CampusCompass architecture

## System boundaries

CampusCompass is a same-site web application with a React/Vite client and an Express REST API. The browser communicates only with the API origin over HTTPS in production. MongoDB Atlas is the system of record. Cloudinary stores approved institution media and review attachments; MongoDB stores only vetted asset metadata and public delivery URLs.

```text
React client ──credentials/include──> Express API ──> MongoDB Atlas
     │                                      │
     │                                      ├──> Google token verification
     │                                      └──> Cloudinary signed server upload
     └── public optimized Cloudinary images <── approved asset URLs
```

The client contains no database, Cloudinary secret, Google server credential, role authority, or long-lived credential. Route visibility in React is a usability measure only; the API is the authorization boundary.

## Design decisions

### Authentication and sessions

Google Identity Services returns an ID token after a user explicitly signs in. `POST /api/auth/google` sends that token to Express, which verifies signature, audience, issuer, expiration, and verified subject using the official `google-auth-library`. The API identifies an account by Google `sub`, never by email alone.

After lookup/create, the server issues a short-lived signed session/JWT in an HTTP-only cookie. Production cookies use `Secure`, `HttpOnly`, and `SameSite=Lax` (or `SameSite=None; Secure` only if separately hosted cross-site). State-changing cookie-authenticated routes validate an origin/CSRF token strategy. The frontend uses `withCredentials`; it never saves Google ID tokens or session tokens in local storage.

New accounts always have role `user`. At startup or through the controlled bootstrap script, only the email in `INITIAL_ADMIN_EMAIL` may be promoted to `admin`; all later role changes require an existing database-backed admin. Suspension is enforced in authentication middleware.

### Public review visibility and rating consistency

Reviews have `pending`, `approved`, `rejected`, or `flagged` status. Every new review and every user resubmission is `pending`. The public review endpoint and all public aggregate calculations query `status: 'approved'` only. Pending, rejected, flagged, moderation-note, reports, account email, and private uploader metadata are not serialized to public clients.

One compound unique index on `{ author: 1, institution: 1 }` enforces one review record per user/institution. A user editing an eligible review updates that record, resets it to pending, and adds an immutable moderation event; they cannot create a second active review. In-flight and duplicate retries are rejected safely by the database index and an idempotency/fingerprint guard.

On approve, reject, flag, delete, and eligible content edits, a service recomputes `ratingAverage`, `ratingCount`, and category averages with a MongoDB aggregation over approved reviews, then writes those server-derived values to the institution. No API accepts a public rating total from a client.

### Media lifecycle

The server accepts only authenticated, authorized uploads where applicable. It validates MIME type, extension, image signature where feasible, image count, and byte limit before uploading via Cloudinary server credentials. Institution media requires administrator authorization. Review attachments are private/pending assets and are never publicly returned until an approving moderator explicitly permits them. Uploads store `{ publicId, secureUrl, width, height, alt, status }`; user supplied alt text is sanitized and bounded. Removing a record requests a Cloudinary delete asynchronously and preserves an audit log.

## Data model

All documents use Mongoose timestamps. `ObjectId` relationships are indexed. Public serializers whitelist their response fields rather than returning models directly.

| Model | Core fields | Indexes and rules |
| --- | --- | --- |
| `User` | `googleSub`, `email`, `name`, `avatarUrl`, `role`, `status`, `lastLoginAt` | unique `googleSub`; normalized, unique email; index `{ role, status }`; roles are `user`/`admin`; status is `active`/`suspended`. |
| `Institution` | `name`, `slug`, `type`, `description`, `history`, `location`, `address`, `coordinates`, `logo`, `coverImage`, `gallery`, `courses`, `departments`, `faculties`, `facilities`, `fees`, `admission`, `contacts`, `officialWebsite`, `status`, `ratingAverage`, `ratingCount`, `categoryAverages` | unique slug; text index on name, city, state, country, course names, department names; indexes for `{ status, type }`, location fields, `ratingAverage`, `createdAt`; only `published` is public. |
| `Review` | `institution`, `author`, `overallRating`, `categoryRatings`, `title`, `body`, `attendancePeriod`, `attachments`, `status`, `moderation`, `version` | unique `{ author, institution }`; indexes `{ institution, status, createdAt }`, `{ author, status }`, `{ status, updatedAt }`; 1–5 ratings, 3–120 title chars, 40–4,000 body chars. |
| `Report` | `review`, `reporter`, `reason`, `details`, `status`, `resolution`, `resolvedBy` | unique `{ review, reporter }`; index `{ status, createdAt }`; only published reviews can be reported. |
| `Favorite` | `user`, `institution` | unique `{ user, institution }`; index `{ user, createdAt }`. |
| `ModerationLog` | `entityType`, `entityId`, `action`, `actor`, `reason`, `before`, `after`, `createdAt` | immutable insert-only collection; index `{ entityType, entityId, createdAt }` and `{ actor, createdAt }`. |

### Institution subdocuments

- **Location:** `country`, `stateProvince`, `city`, optional validated GeoJSON point.
- **Course:** `name`, `level`, `duration`, optional `department`, and public visibility flag.
- **Facility:** controlled `code`, `label`, optional description; codes include library, laboratories, computer-labs, classrooms, sports, cafeteria, hostel, transport, internet, and accessibility.
- **Fee:** `label`, `amount`, `currency`, `period`, `source` (`institution-provided` or `unverified`), and optional notes. Missing facts remain absent—not fabricated.
- **Contact:** public phone/email/address fields and validated official social/website links.

## Route contract

Routes are listed in [API.md](API.md). All list routes accept bounded `page` and `limit` values and return:

```json
{ "data": [], "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 } }
```

Errors use a consistent non-sensitive shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed.", "fields": { "title": "Must be at least 3 characters." } } }
```

## Security baseline

- Strict CORS allow-list from `FRONTEND_URL`; credentials enabled only for those configured origins.
- Helmet headers, request-size limits, compression, structured error logging, and server health endpoint.
- Rate limits: global API, tighter auth, review write, report, and upload limits; rate-limit response does not disclose account existence.
- Zod validates params, query, and JSON body. Sanitize string fields, reject MongoDB operator keys, whitelist sort values, constrain regex/search input, and use Mongoose `strictQuery`.
- Cookie authentication plus origin/CSRF controls for mutation endpoints; no state-changing GET endpoints.
- Server code determines user, ownership, role, review state transitions, derived rating, and Cloudinary folder/public ID. Client input cannot set these.
- Audit moderation actions and institution publication changes. Do not expose audit logs, reporter identities, moderation notes, suspended-user data, or unpublished assets publicly.
- Environment schema fails fast for malformed/missing required runtime configuration. `.env` files are ignored and examples contain placeholders only.

## Implementation phases and checklist

### Phase 1 — architecture (complete)

- [x] Inspect existing workspace.
- [x] Define application boundaries, models, indexes, routes, and security decisions.
- [x] Record folder structure, milestones, status, and credential requirements.

### Phase 2 — frontend foundation and public experience

- [ ] Scaffold Vite React client and Tailwind.
- [ ] Build accessible design tokens, logo, layouts, navigation, reusable primitives, skeletons, empty states, and toast system.
- [ ] Build responsive home, discovery, detail, comparison, sign-in, and policy pages using explicitly marked local seed data.
- [ ] Add frontend routing, URL-driven filters, metadata, and frontend unit tests.

### Phase 3 — API, models, and authorization

- [ ] Scaffold Express server; add config validation, database connection, security middleware, errors, health check, and test harness.
- [ ] Implement models, validators, public institution/review APIs, favorites, reports, and protected admin CRUD.
- [ ] Implement Google token verification, database roles, cookie sessions, suspension, controlled admin bootstrap, and review moderation/rating service.
- [ ] Add Supertest coverage for auth, role enforcement, moderation, and public visibility.

### Phase 4 — live integrations

- [ ] Replace seed data with client API services and loading/error states.
- [ ] Integrate Google Identity Services after a Client ID is supplied.
- [ ] Integrate Cloudinary server uploads and moderated assets after credentials are supplied.
- [ ] Implement review submission/edit/resubmission, dashboard, admin queue, and institution editor end-to-end.

### Phase 5 — discovery and product depth

- [ ] Complete composable backend search/filter/sort/pagination and responsive filter UX.
- [ ] Complete comparison (maximum three institutions), favorite lists, report management, dashboard/account views, and dashboard metrics.
- [ ] Add seed script with clearly fictitious/local development institutions and images or neutral placeholders.

### Phase 6 — release hardening

- [ ] Add full test coverage, accessibility checks, production error handling, sitemap/robots/canonical/OG metadata, and image optimization.
- [ ] Run production builds, security review, dependency audit, and deployment documentation.
- [ ] Add privacy/retention statements and production environment checklist.
