# 13 — Using CampusCompass as a user

## Browse institutions

1. Open the home page and choose **Discover**, or open `/institutions`.
2. Search by institution name, city, country or course text.
3. Use the available type, location, facility, rating and sort filters.
4. Select a result card to open its institution page. Only published institutions appear publicly.

The detail page can show the institution's images, location, public courses, facilities, contact/admissions information and approved reviews. Missing details mean an administrator has not entered them.

## Compare institutions

Select institutions for comparison from their cards, then open **Compare**. Choose two or three available published institutions. The compare page reads actual institution records; it does not create sample schools.

## Sign in with Google

1. Choose **Sign in** in the top navigation.
2. Select the Google button and choose your account.
3. When sign-in succeeds, the profile image/name appears in the navigation. CampusCompass checks your session again after a page refresh.
4. If the origin is rejected, contact the site administrator; the local OAuth client must allow the exact site origin.

CampusCompass gets your name, email and picture from the verified Google account. It does not ask for a Google password in the CampusCompass form.

## View your profile and saved institutions

Open the profile menu and choose **My Profile**. The page shows your account details, review status and saved institutions. Use the save/favorite control on a published institution page to add or remove a favorite. Favorites are associated with your signed-in account.

## Submit a review

1. Sign in, then choose **Write a review**.
2. Select a published institution.
3. Choose an overall rating from one to five stars and complete the title and detailed review. The detailed text must contain at least 40 characters.
4. Add category ratings, pros/cons and attendance period where appropriate.
5. Submit. The new review appears in your profile as **Pending**.
6. Add supported JPEG, PNG or WebP photos while the review is pending, if the form offers the attachment control.
7. Return to your profile later to see the moderation status.

One user may submit one review per institution. Pending and rejected reviews are not public. An administrator must approve a review before it appears publicly or affects the rating.

## Report a review

On a public review, choose **Report this review**, select the closest reason and optionally enter details, then submit. You cannot report your own review. Reports are private to moderators.

## Sign out

Open the profile menu and choose **Sign out**. CampusCompass calls the backend logout endpoint, invalidates the current session version, clears the HTTP-only cookie and returns you to the homepage. Protected pages require sign-in again.

## What a normal user cannot do

Normal users cannot publish institutions, moderate reviews, manage accounts or use administrator APIs. Changing a URL or editing browser data does not grant permission; the backend checks the account role.
