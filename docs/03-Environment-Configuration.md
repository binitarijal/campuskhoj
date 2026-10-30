# 03 — Environment configuration

Environment files hold settings used while the app runs. Never paste a private value into a source file, a screenshot, a support message or a browser-visible Vite variable.

## Backend file

1. In VS Code's Explorer, open `backend/.env.example`.
2. Copy it and name the copy `backend/.env`.
3. Replace each placeholder on your own computer. Do not replace unrelated values if `backend/.env` already exists; edit only the setting you need.
4. Save the file and restart the backend terminal.

The backend expects these names:

| Name | Purpose | Private? |
|---|---|---|
| `NODE_ENV` | `development` locally; `production` after deployment | No |
| `PORT` | Express port, normally `5000` | No |
| `FRONTEND_URL` | Comma-separated frontend origins allowed by CORS | No |
| `MONGODB_URI` | Atlas connection string | **Yes** |
| `GOOGLE_CLIENT_ID` | Backend token audience for Google sign-in | Public identifier |
| `VITE_GOOGLE_CLIENT_ID` | Same public Google client ID, loaded by Vite for the browser button | Public identifier |
| `SESSION_SECRET` | Signs the CampusCompass session cookie | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | Not secret |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Treat as private |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | **Yes** |
| `INITIAL_ADMIN_EMAIL` | Optional email of an already registered user to provision as admin | Private account info |

Use the Google **Web application** client ID from the same OAuth client configured for the frontend. The session secret must be at least 32 characters; generate a new random secret for production. Never share it.

## Frontend public settings

The current `frontend/vite.config.js` reads only `VITE_`-prefixed public settings from `backend/.env`. The Google client ID is already configured there, and `src/lib/api.js` defaults the API URL to `http://localhost:5000/api`. Therefore a separate `frontend/.env` is not required for the current local setup.

If you need to override public settings for a special local setup, copy `frontend/.env.example` to `frontend/.env`, set only `VITE_API_BASE_URL` and/or `VITE_GOOGLE_CLIENT_ID`, then restart Vite. Vite variables are visible in browser code. **Never put** MongoDB URI, session secret, Google client secret, or Cloudinary credentials in a frontend environment file.

## Git and safety

The `.gitignore` excludes `.env` files and permits only `.env.example` templates. This workspace copy does not include `.git` metadata, so `git check-ignore` could not run during this audit. In a Git checkout, verify with:

```powershell
git check-ignore backend/.env frontend/.env
```

The command should list both files as ignored. If a real credential was ever committed, removing the file is not enough: rotate that credential in its provider.

Do not print the values when asking for help. You can report only whether a key exists and which error name appears.
