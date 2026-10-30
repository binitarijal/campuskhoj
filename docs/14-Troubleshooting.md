# 14 — Troubleshooting

First check that both terminals are still running and that `http://localhost:5000/health` reports a connected database. Never paste secret values into a bug report.

| Message or symptom | What to check |
|---|---|
| `MONGODB_URI is required` or invalid backend environment configuration | Confirm `backend/.env` exists and contains the required variable names. Do not include quotes accidentally or leave a required placeholder unchanged. Restart the backend. |
| `MongoServerSelectionError`, `Server selection timed out`, `ETIMEOUT`, or health `503` | In Atlas confirm the cluster is running and Network Access permits your current public IP. Check VPN, firewall and DNS/network access, then confirm the database user/URI are still valid. Wait for the backend retry, then refresh `/health`. A timeout means the backend could not reach a MongoDB server in time; it does not reveal the URI or password. |
| `Authentication failed` from MongoDB | Atlas **Database Access** uses a database user, not your Atlas website login. Reset that database user's password if needed and update only `MONGODB_URI`. URL-encode special characters in the password. |
| TLS/certificate or `ECONNRESET` errors | Update Node.js to a supported version, check the computer clock, VPN/firewall and TLS inspection software, then retry. Do not disable TLS validation. |
| Google says `The given origin is not allowed for the given client ID` | In Google Cloud Console, open the Web application OAuth client and add the exact browser origin such as `http://localhost:5174` under Authorized JavaScript origins. Add `http://localhost:5173` too if you use it. Make the frontend and backend client IDs match. Restart Vite after changing its `.env`. |
| Google login button reports no client ID | Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to the public Web client ID, and `GOOGLE_CLIENT_ID` to the same ID in `backend/.env`. Do not put a client secret in Vite. |
| Google login returns HTTP 401 | The backend rejected the ID token. Verify the client IDs match, browser origin is authorized, computer time is correct and the sign-in account is verified. Check backend log stage labels without printing the token. |
| Google login returns HTTP 500 | Read the backend terminal exception name and safe code. Check that `/health` is connected and inspect whether the log reached token verification, Mongo lookup or user save. Never print the credential, cookie or environment values. |
| `CORS` or missing `Access-Control-Allow-Origin` | The frontend origin must exactly match one of the comma-separated origins in `FRONTEND_URL`, including scheme and port. Do not use `*` with cookies. Restart the backend after editing. |
| Image upload fails | Confirm Cloudinary values exist only in `backend/.env`, database and backend are connected, file is JPEG/PNG/WebP and no larger than 8 MB. Check the backend terminal for a safe provider error name. Sandbox/network errors may prevent external upload testing. |
| Profile photo is blank | Confirm Google supplied a picture and the browser can load the Google image URL. Sign out and in to refresh profile data. The site can show a placeholder if Google has no image. |
| `/admin` says access denied | Confirm the right account was bootstrapped, sign out and in after role changes, and check database readiness. Normal accounts cannot use the admin API. |
| Review does not appear publicly | Check the author's profile status. Only **Approved** is public. An institution must also be published. Pending/rejected/flagged/hidden/removed records are deliberately excluded. |
| Institution does not appear in search | Check its publication status is **Published**, it meets the publish requirements and search filters are not excluding it. Draft and archived records are private. |
| Frontend says the API request failed | Confirm backend terminal is running on port 5000, `VITE_API_BASE_URL` is correct, CORS allows the frontend origin and `/health` responds. |
| `EADDRINUSE` / port already in use | Stop the other process using the port with Ctrl+C. If you cannot find it, restart the computer or change `PORT` and the matching frontend API URL/CORS value. |
| Lint shows warnings | Warnings are not the same as build errors. Review the exact file and line. `npm run build` is the production compilation check. Current lint warnings are tracked in `PROJECT_STATUS.md`. |

## Get useful help safely

Share the exact error message, which command you ran, whether `/health` is connected, and the backend stage label. Replace email addresses and IDs if they identify a real person. Never include `.env`, Google ID tokens, cookies, MongoDB URIs, passwords or Cloudinary secrets.
