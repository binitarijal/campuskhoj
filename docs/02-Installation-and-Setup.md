# 02 — Installation and setup

## What you need

- A computer with Windows, macOS or Linux.
- VS Code or another editor.
- Node.js 22.12 or newer and npm. In VS Code, open **Terminal → New Terminal** and run:

```powershell
node --version
npm.cmd --version
```

If `node` is not recognized, install Node.js, close and reopen VS Code, and run the commands again.

- A MongoDB Atlas cluster, a database user and a network access rule for your current IP address.
- A Google OAuth **Web application** client ID with the local frontend origins allowed.
- A Cloudinary account if you want to upload images.

## Open the existing project

1. In VS Code choose **File → Open Folder**.
2. Select the existing `CampusCompass-master` folder.
3. In the Explorer, confirm that you see `backend`, `frontend`, `docs`, `README.md` and `PROJECT_STATUS.md`.
4. Do not create another Vite or Express project inside this folder.

## Install packages

Open a terminal at the project root. Then install the packages in each existing app folder:

```powershell
cd backend
npm.cmd install
cd ..\frontend
npm.cmd install
```

You normally do this once, and again only after package dependencies change.

## Configure the app

Follow [Environment configuration](03-Environment-Configuration.md). Keep private values in `backend/.env`; the existing Vite config reads only public `VITE_` values there. A separate `frontend/.env` is only for optional public overrides. The `.env.example` files contain placeholders, not working credentials.

## Quick checks

From `frontend/`, `npm.cmd run build` checks that the production bundle can be created. From `backend/`, `npm.cmd run check` checks the server and app syntax. A successful build does not prove Atlas or Cloudinary connectivity; use [Database setup](04-Database-Setup.md) and [Troubleshooting](14-Troubleshooting.md) for those checks.
