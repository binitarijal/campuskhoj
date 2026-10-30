# 11 — Review approval guide

Every newly submitted review begins as **Pending**. Public institution pages and public rating aggregates use **Approved** reviews only. Rejected, flagged, hidden and removed reviews remain private from public review queries. Internal notes are for moderators and are not shown on public pages.

## Find a pending review

1. Sign in with an administrator account.
2. Open **Admin → Review moderation**.
3. Use the status filter or search to find a pending review.
4. Open the review to inspect the author, institution, rating, text, submission date and any images.

## Approve a review

1. Check that the review describes a real experience and follows your community rules.
2. Select **Approve** and confirm if prompted.
3. Wait for the success message. The review's status becomes Approved.
4. Open the public institution page. The review should appear and the rating/count should include it.

Approving an already approved review is rejected by the backend as a conflict, which prevents duplicate rating updates. Ratings are recalculated from approved records in the moderation transaction.

## Reject, flag, hide or remove

- **Reject** a pending review that should not be published. Add a concise reason. It stays in the user's profile with its status but is not public.
- **Flag** a pending review that needs further attention. It remains private.
- **Hide** an approved review when it should stop appearing publicly but may need review later.
- **Remove** a review when the moderator decides it should no longer be available. The action is recorded in moderation history.

Use the reason/note field carefully. Notes are internal. Never include passwords, tokens or unrelated private data.

## Review images

Images attached to a review are pending until moderation. Approved review images are shown publicly with an approved review. Rejected or otherwise hidden content does not expose those attachments through the public API.

## Reports

Open **Admin → Reported content** to inspect reports submitted on public reviews. Choose dismiss or resolve/remove based on the evidence, then enter a decision reason. Duplicate reports by the same user for one review are prevented by a database unique constraint. Admin decisions are audited.

## Verify review privacy

After a user submits a review, open the public institution page in a signed-out/private browser window. Confirm the pending review is absent. After approval, reload that page and confirm it appears. Do not use a user's profile page as proof of public visibility; the author can see their own private status.
