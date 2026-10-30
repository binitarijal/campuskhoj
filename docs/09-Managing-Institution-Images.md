# 09 — Managing institution images

Institution and review image uploads go through the backend to Cloudinary. The frontend does not need a Cloudinary API secret. Upload requires a saved institution record and a connected backend, database and Cloudinary account.

## Prepare an image

- Use JPEG, PNG or WebP.
- Keep each image at or below 8 MB.
- Choose a clear, relevant photo that you have permission to use.
- Do not upload private student records or sensitive personal information.

## Upload a logo, cover or gallery image

1. Open **Admin → Institutions** and edit the saved institution.
2. Open the **Images** tab.
3. Under the logo or cover area, choose **Upload** or drag a supported image into the upload box. The browser's file picker opens if you choose the box.
4. Select the image and choose **Open**. Wait for the upload message before leaving the page.
5. For gallery photos, choose the gallery upload box and select one or more files.
6. Confirm that previews appear. Use drag-and-drop on a gallery thumbnail to change its order; the order is saved to the database.
7. Press **Save changes** if you also changed institution fields.
8. Open the public page after publishing and check the logo, cover and gallery.

New drafts must be created first because Cloudinary media is attached to a saved institution ID. If the upload fails, see [Troubleshooting](14-Troubleshooting.md).

## Facility and faculty images

In the Facilities tab, create a facility row before adding photos. In Courses & faculty, create and save a faculty profile before uploading its photo. The image is attached to that specific nested item.

## Delete an image

Use the trash button on a preview. Confirm the browser prompt. The backend removes the image reference and asks Cloudinary to delete the asset. If Cloudinary cleanup fails, the listing reference is detached but the Cloudinary asset may need manual removal in the Cloudinary console; the UI reports this case.

## Missing images

Check that the upload succeeded, the institution changes were saved, and the record is published. A failed upload should not produce a valid preview. A broken image URL may mean the Cloudinary account or asset was removed.
