# 15 — Deployment guide

This is a deployment checklist, not a claim that a production host has been configured or tested. Choose hosting that supports Node.js, environment variables, HTTPS, outbound MongoDB/Cloudinary access and persistent logs.

## Before deployment

1. Run the frontend build and backend checks locally.
2. Back up Atlas using [Backup and restore](16-Backup-and-Restore.md).
3. Create a production MongoDB database user with only the permissions the app needs. Allow the production backend's outbound IP/network in Atlas.
4. Create a production Google OAuth Web client. Add the exact HTTPS frontend origin to Authorized JavaScript origins.
5. Decide on a same-site frontend/API domain arrangement, for example `www.example.com` and `api.example.com`. This app uses an HTTP-only cookie with `SameSite=Lax`; unrelated cross-site domains may prevent the browser from sending it. Test session restore and logout in the target browsers.
6. Create production Cloudinary credentials and restrict access appropriately.

## Backend host

For Vercel, configure the project **Root Directory** as `backend/`. The `backend/api/index.js` entrypoint and `backend/vercel.json` rewrite expose the Express app's `/`, `/health`, and `/api/*` routes as a serverless function. Deploy the existing `backend/` package with Node.js 20+ (Node 22.12+ is recommended for consistency). Use `npm install` and `npm start` on hosts that run a long-lived Node process. Configure the required backend environment names from `backend/.env.example` in the provider's secret/settings panel. Set `NODE_ENV=production`, a secure `SESSION_SECRET`, a production `MONGODB_URI`, and `FRONTEND_URL` to the exact HTTPS frontend origin(s). Do not upload `.env` to the host or Git.

Expose `/health` as a readiness check. The server can listen before MongoDB finishes connecting, so configure the deployment platform to treat the database readiness field as the application readiness signal if supported.

## Frontend host

Build the existing `frontend/` package with `npm run build` and serve the generated `frontend/dist/` directory using a static host configured to send React Router routes back to `index.html`. Set build-time `VITE_API_BASE_URL` to the production API base URL and `VITE_GOOGLE_CLIENT_ID` to the public client ID. These values become visible in browser code; do not put credentials there.

## After release

1. Open the deployed frontend and check the browser console for API/CORS errors.
2. Check the backend `/health` response.
3. Sign in, refresh the page, open a profile, and sign out.
4. Test one draft institution and image upload using a non-production or approved test record.
5. Submit a test review and confirm it remains private before approval.
6. Check the admin activity log and remove test content only through the application.
7. Monitor provider logs and Atlas metrics. Keep a rollback build and database backup.

Never use the disposable integration test against a production database. Do not enable permissive CORS or expose secrets to resolve a deployment issue.
