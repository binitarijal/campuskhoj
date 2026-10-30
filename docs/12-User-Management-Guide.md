# 12 — User management guide

Only an administrator can open **Admin → Users** and call user-management APIs.

## Search and inspect

1. Open the Users page from the admin sidebar.
2. Search by a user's name or email, or use role/status filters.
3. Open the user row to view safe account details and review history.
4. Check the account status and registration/last activity fields before making a change.

## Suspend or reactivate

1. Find the correct account and verify its email.
2. Choose **Suspend** to block the account, or **Reactivate** to restore an eligible suspended account.
3. Confirm the operation if asked.
4. The backend increments the account's session version when access changes. Existing cookies stop authorizing protected requests; the suspended account must sign in again after reactivation.

Use suspension when you need to preserve the account and its review history. Deactivation is also a status change; it is not a MongoDB record deletion.

## Change administrator role

An administrator may change another user's role using the role action. Verify the account identity before granting admin access. The backend prevents unsafe last-active-admin changes and records the action. Do not ask a user to change their own role through a browser request.

## User data and deletion

The current user management uses active/suspended/deactivated status to preserve review and audit history. A permanent delete action is not part of the normal user workflow. Avoid manually deleting user rows in Atlas: related review history and audit attribution would be damaged.

## Check the result

After an account status change, try an authenticated protected page or endpoint using that account. A suspended/deactivated user should be denied. Then inspect **Activity logs** for the administrator action.
