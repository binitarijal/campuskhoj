# 06 — Admin account setup

Normal Google sign-ups are regular users. The first registered user is **not** automatically an administrator.

## Set up the administrator

1. Start MongoDB and both development servers. Confirm `/health` says the database is connected.
2. Open the CampusCompass site and choose **Sign in**.
3. Sign in with the Google account that should administer the project. This creates or loads that account as a normal user.
4. Stop the backend with Ctrl+C.
5. Open `backend/.env` in VS Code. Add or update `INITIAL_ADMIN_EMAIL` to the exact email used for Google sign-in. Do not replace other settings or share this file.
6. In the backend terminal run:

```powershell
cd backend
npm.cmd run bootstrap:admin
```

7. Check for a success message that names no secret values. The script promotes only the matching existing user and records an audit entry. If it reports that no existing user matched, sign in once with the correct Google account and check the email spelling.
8. Restart the backend with `npm.cmd run dev`.
9. Sign out in the browser, then sign in again. The browser's current cookie may still have the old role until it is refreshed.
10. Open `/admin`. The admin dashboard should load. A normal account is redirected away, and admin APIs also check the role on the backend.

## Remove bootstrap access from the environment

After the intended admin has been provisioned, remove or blank `INITIAL_ADMIN_EMAIL` if you do not expect to run the bootstrap command again. The script can be run again, but it is not intended to be the normal way to manage users.

## Add another administrator

An existing administrator can open **User management**, inspect the person's account, and use the role action to grant administrator access. Confirm the email carefully. The backend protects the last active admin and records role changes.

## If admin access is denied

Check that the correct Google email was used, the database is connected, and the user row has the admin role. Sign out and sign in after a role change. Never make yourself an admin by editing browser storage or sending a role from the frontend; the backend ignores that as an authorization source.
