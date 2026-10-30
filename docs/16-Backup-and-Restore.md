# 16 — Backup and restore

Backups protect against mistakes and provider failures. Do not test restore steps on your only production database.

## Atlas backup options

Atlas menus vary by plan and interface version. Use the Atlas **Backup** or **Database Backups** area for a managed snapshot if your cluster plan includes it. Confirm the backup time, retention and restore procedure before a schema release.

For a manual export, use MongoDB Database Tools (`mongodump`) from a trusted computer. Store the output in an encrypted, access-controlled location. The URI contains credentials; never put it directly in a shared script or shell history. Prefer a temporary least-privilege database user, then revoke it after the backup.

The basic tool pattern is:

```powershell
mongodump --uri "<private MongoDB URI>" --out "<private backup folder>"
```

Replace placeholders locally. Do not paste the command with its actual URI into chat, documentation or a public terminal recording.

## Restore checklist

1. Tell users the site will be unavailable during recovery.
2. Take a fresh backup of the current database before restoring anything.
3. Restore the snapshot into a separate recovery database first, when possible.
4. Inspect users, institutions, reviews and favorites in Atlas.
5. Confirm the intended target database and backup date with another person if the data is important.
6. Use Atlas's restore workflow or `mongorestore` with the correct database selection. Never run a restore command against production until the target and overwrite behavior are understood.
7. Update the backend `MONGODB_URI` only if the recovered database should become active.
8. Restart the backend and confirm `/health` is connected. Verify a few known records in the app.

## Cloudinary images

MongoDB stores Cloudinary secure URLs and public IDs; the image bytes are held by Cloudinary. A MongoDB backup does not back up those image bytes. Keep Cloudinary account access protected, review its asset backup/export options, and retain original image files when practical.

## Practice safely

Use a separate test cluster/database to practice backup and restore. The CampusCompass integration test can drop its uniquely named disposable database; it must never be pointed at a production database where that behavior could affect real data.
