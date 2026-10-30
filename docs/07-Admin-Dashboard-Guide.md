# 07 — Admin dashboard guide

Only an active account whose database role is `admin` can use administrator APIs. Once signed in, choose **Administration** from the profile menu or open `/admin` directly.

## Dashboard overview

The first page shows live MongoDB counts for institutions, types, users, account statuses, review moderation statuses and reports. It also shows recent users, reviews and institutions, registration/review trends, and institution type distribution. If the database is empty, zero counts are real results rather than sample data.

Use the sidebar to open:

| Page | Where to go | What it does |
|---|---|---|
| Overview | `/admin` | Live counts, trends and recent records |
| Institutions | `/admin/institutions` | Search, filter, edit, publish, archive or delete eligible records |
| Add institution | `/admin/institutions/new` | Create a draft record |
| Review moderation | `/admin/reviews` | Approve, reject, flag, hide or remove reviews |
| Users | `/admin/users` | Search accounts, inspect reviews, change account status or role |
| Reported content | `/admin/reports` | Review and resolve user reports |
| Categories & courses | `/admin/catalog` | Create, edit and deactivate institution/course category labels |
| Analytics | `/admin/analytics` | Dashboard trend and distribution data |
| Activity logs | `/admin/activity` | Review recorded administrator actions |
| Settings | `/admin/settings` | Read security/bootstrap guidance |

The Settings page is not a saved settings editor. To change environment configuration, edit the local backend environment file and restart the server.

## Page controls

- Use the search box and filters above a table, then press **Enter** or select a filter.
- Use **Refresh** or **Retry** after an API error.
- Use page controls below long lists to move between results.
- Confirm before status changes or deletion. If a browser confirmation appears, read it before choosing **OK**.
- Success and failure messages appear near the upper right of the page.

## A first administrator check

Open **Institutions**. If the list is empty, create and publish a complete record using [Adding institutions](08-Adding-Institutions.md). Then open a public institution page in another browser tab. This verifies what ordinary visitors can see.

## Activity logs

Open **Activity logs** to check who created or changed an institution, moderated a review, handled a report, or changed a user. Logs are audit records, not a general application console. Do not edit them directly in MongoDB.
