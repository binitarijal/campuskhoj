# CampusCompass beginner guides

These guides explain how to install, run and use the existing CampusCompass application. They describe the current implementation and point out features that still need a live MongoDB or Cloudinary check. They do not include private credentials.

## Start here

1. Follow [Installation and setup](02-Installation-and-Setup.md).
2. Configure the files in [Environment configuration](03-Environment-Configuration.md).
3. Check [Database setup](04-Database-Setup.md).
4. Start both servers with [Starting the application](05-Starting-the-Application.md).
5. If you are administering the site, complete [Admin account setup](06-Admin-Account-Setup.md), then use the [Admin dashboard guide](07-Admin-Dashboard-Guide.md).

## Guides

| Guide | What it explains |
|---|---|
| [01 — Project overview](01-Project-Overview.md) | What the application does and how its parts connect |
| [02 — Installation and setup](02-Installation-and-Setup.md) | Preparing the computer and installing packages |
| [03 — Environment configuration](03-Environment-Configuration.md) | Safe setup of backend and browser settings |
| [04 — Database setup](04-Database-Setup.md) | MongoDB Atlas network and database user setup |
| [05 — Starting the application](05-Starting-the-Application.md) | Start, stop and check both development servers |
| [06 — Admin account setup](06-Admin-Account-Setup.md) | Securely grant administrator access |
| [07 — Admin dashboard guide](07-Admin-Dashboard-Guide.md) | Dashboard, user, report and activity areas |
| [08 — Adding institutions](08-Adding-Institutions.md) | Create, draft, publish, edit and archive listings |
| [09 — Managing institution images](09-Managing-Institution-Images.md) | Upload and manage Cloudinary images |
| [10 — Managing courses and faculties](10-Managing-Courses-and-Faculties.md) | Institution academic information |
| [11 — Review approval guide](11-Review-Approval-Guide.md) | Pending, approved and rejected review workflow |
| [12 — User management guide](12-User-Management-Guide.md) | Search, inspect and manage user accounts |
| [13 — Using CampusCompass as a user](13-Using-CampusCompass-as-a-User.md) | Browse, compare, review and save institutions |
| [14 — Troubleshooting](14-Troubleshooting.md) | Common local setup and account errors |
| [15 — Deployment guide](15-Deployment-Guide.md) | Preparation for a production deployment |
| [16 — Backup and restore](16-Backup-and-Restore.md) | Protect and recover Atlas data and images |
| [17 — FAQ](17-FAQ.md) | Short answers to common questions |

For endpoint details see [API.md](API.md). For the system design and security boundaries see [ARCHITECTURE.md](ARCHITECTURE.md). The current test and implementation status is recorded in [PROJECT_STATUS.md](../PROJECT_STATUS.md).

## Important current limitations

- The Settings page is an explanation page; it does not save platform-wide settings.
- Courses, facilities and faculty profiles are stored inside their institution document, rather than separate collections.
- Administrator bootstrap requires an existing Google-authenticated account.
- This execution could not verify the current Atlas connection, Cloudinary uploads, or end-to-end admin workflows. Do not treat those external integrations as certified until you complete the checks in the guides and `PROJECT_STATUS.md`.
- No screenshots are included because they would need to be captured from a verified running application. Interface locations are described in words instead.
