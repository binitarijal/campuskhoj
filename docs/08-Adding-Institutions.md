# 08 — Adding institutions

You need an administrator account and a connected MongoDB database. Institution edits are saved to MongoDB; a newly created institution starts as a **draft** and is not visible in public search.

## Create a draft

1. Open `/admin` and choose **Institutions** in the sidebar.
2. Press **Add institution**.
3. In the **Basics** tab, enter the institution name. The URL slug is suggested from the name; check it because it becomes part of the public web address.
4. Choose **School**, **College** or **University**.
5. Enter the city and country. Add description, established year, accreditation, official website and contact information where available.
6. Choose a verification status. New records default to **Unverified**. Verification status is separate from whether an institution is published.
7. Open **Courses & faculty** and add at least one public course. Publishing requires a description of at least 40 characters and at least one visible course.
8. Add facilities, images, fees, admissions and scholarships in the related tabs as available. See [Courses and faculties](10-Managing-Courses-and-Faculties.md) and [Images](09-Managing-Institution-Images.md).
9. Press **Create draft**. The record is saved and the page opens the saved record so you can upload images.

## Publish

1. Save your content changes.
2. Return to the **Institutions** list.
3. Find the draft. Check its name, publication status and verification status.
4. Select the publish icon/button. Confirm the browser prompt if it appears.
5. If the API says the description or course is missing, open **Edit**, complete those fields, save, then publish again.
6. Open `/institutions` in a public browser tab and search for the institution. A published listing should be available by its slug.

## Edit and unpublish

In the institution list, choose the pencil/edit button beside the record. Change a field and press **Save changes**. To remove a published listing from public pages temporarily, use **Unpublish**; it becomes a draft. Review and favorite records are preserved.

## Archive or delete

- **Archive** keeps the record and hides it from public pages. This is the recommended option for a school that has closed or should no longer appear.
- **Delete** is permanent and is allowed only when no reviews or saved records depend on the institution. The API asks for explicit confirmation and rejects deletion when dependent records exist. Archive instead of deleting if people have reviewed or saved it.

## Search and filters

Use the search field for a name, slug or city. Use the type and publication status selectors to narrow the list. Use the pagination buttons below the table when there are multiple pages.
