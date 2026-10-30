# 04 — Database setup

CampusCompass uses the existing MongoDB Atlas cluster through Mongoose. The application does not need a manual collection reset or a separate database per feature.

## Atlas checks

1. Sign in to MongoDB Atlas and open the project that owns your existing cluster.
2. Confirm the cluster is running.
3. Open **Database Access** and verify a database user exists. This is separate from your Atlas website login.
4. Open **Network Access** and allow the IP address of the computer running CampusCompass. For a temporary local check, use Atlas's current-IP helper. Avoid allowing every address for a permanent setup.
5. Open **Database → Connect → Drivers**. Choose Node.js and copy the connection string into `MONGODB_URI` in `backend/.env` on your computer.
6. Replace the username, password and database placeholders in Atlas's connection string. URL-encode reserved characters in a password as Atlas instructs.
7. Restart the backend. Visit `http://localhost:5000/health`.

The health response should report `status: "ok"` and `database: "connected"`. A `503` response means the API process is running but Mongoose is not connected. Do not interpret an HTTP 200 from `/` as proof that the database is ready.

## Existing collections and schema changes

Mongoose creates a collection when the application first writes a document for a model. Current models include users, institutions, reviews, reports, favorites, categories, moderation logs and admin roster entries. Courses, facilities and faculty profiles are nested in an institution record.

Do not drop a collection to apply a schema change. The new institution `verificationStatus` field defaults to `unverified` when an old record is loaded without that field. The code does not delete records or replace your database.

## Indexes

Schemas define unique indexes for Google identity/email, institution slugs, one review per user and institution, duplicate reports per reporter/review, favorites and category slugs. MongoDB may build indexes when the model initializes. Index creation against a production cluster should be monitored, especially if the database is large.

## Check persisted data safely

Use Atlas **Browse Collections** to view records. Never edit role, review status or rating aggregates by hand as a normal workflow; use the CampusCompass admin pages so the related audit entries and rating calculations also run.

Before a production schema release, take a backup using [Backup and restore](16-Backup-and-Restore.md). The application integration test uses a separately named disposable database and must not be run against a production URI without first checking the test and database permissions.
