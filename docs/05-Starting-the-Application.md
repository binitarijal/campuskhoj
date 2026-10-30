# 05 — Starting the application

Start the backend and frontend in two terminals so you can see errors from each.

## Terminal 1: backend

In VS Code choose **Terminal → New Terminal**, then run:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

Wait for the message that the API is listening on port `5000`. The backend retries Atlas connection attempts when the database is temporarily unavailable. Open `http://localhost:5000/health` in a browser. Confirm the database reports `connected` before testing database features.

## Terminal 2: frontend

Open a second terminal using the plus button in the Terminal panel, then run:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. It defaults to `http://localhost:5173` and may choose `5174` when the default port is occupied. If Google says the origin is not allowed, add the exact printed origin in the Google OAuth client and backend `FRONTEND_URL`.

## Stop and restart

Click a terminal and press **Ctrl+C** once to stop that development server. To apply `.env` changes, stop and restart the corresponding server. Vite reads browser variables when it starts.

## Useful checks

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run build
```

From `backend/`:

```powershell
npm.cmd run check
npm.cmd test
```

`npm test` requires MongoDB access and an account allowed to create/drop a uniquely named disposable test database. If it stalls or Atlas is unavailable, stop it with Ctrl+C and record that it did not pass. It is not a safe production smoke test.

## Local URLs

| Service | Usual local address |
|---|---|
| Frontend | `http://localhost:5173` (or `5174` if 5173 is occupied) |
| Backend root | `http://localhost:5000/` |
| Backend health | `http://localhost:5000/health` |
| API base | `http://localhost:5000/api` |

If a port is already in use, see [Troubleshooting](14-Troubleshooting.md).
