# 17 — Frequently asked questions

### Which command starts the website?

Open two terminals. In one run `cd backend` then `npm run dev`. In the other run `cd frontend` then `npm run dev`. The details are in [Starting the application](05-Starting-the-Application.md).

### Why does a new school not show in search?

New institutions start as drafts. Save the record, add a detailed description and a public course, then publish it from **Admin → Institutions**.

### Why can the author see a review that visitors cannot?

Authors can see their own review status in their profile. Public pages show approved reviews only.

### Does the first Google account become an administrator?

No. A trusted operator must explicitly set up an administrator using the bootstrap process in [Admin account setup](06-Admin-Account-Setup.md).

### Where do I put Google and Cloudinary settings?

The Google client ID is public browser configuration and must match the backend audience. Google client secrets, MongoDB URI, session secret and Cloudinary API secret stay in `backend/.env`. See [Environment configuration](03-Environment-Configuration.md).

### Do I need to create a database collection manually?

No. Mongoose models define the collections and indexes. Keep the existing records; do not drop collections to apply a new field.

### Can I delete an institution with reviews?

The application blocks permanent deletion while reviews or favorites depend on it. Archive it instead to preserve history.

### Can users edit their Google name or picture in CampusCompass?

The current account page uses the verified Google profile. Update the Google profile and sign in again to refresh those details.

### Is the Admin Settings page a configuration form?

No. It currently displays security and setup guidance. Change local configuration in environment files and restart the appropriate server.

### Has the live Atlas and Cloudinary workflow been fully tested here?

No. The latest execution could not complete the Atlas connection/test handshake or an external Cloudinary upload. Check [PROJECT_STATUS.md](../PROJECT_STATUS.md) for the actual results and repeat the checks in your environment.

### Where can I find API names?

Read [API.md](API.md). Administrator APIs require a valid cookie and a database user with the admin role.
