# Volunteer portal setup

The public volunteer page provides a short online interest form and a printable sign-up sheet; neither creates an account. The form collects first name, last name, optional pronouns, optional contact number, email, preferred contact method, and a privacy-notice acknowledgement. Online submissions expire 14 days after receipt and are automatically deleted by a scheduled Supabase `pg_cron` job. Paper sheets must be securely destroyed within 14 days of collection. HASH supplied a Volunteer Code of Conduct PDF marked `[INTERNAL]`; it has not been copied to public assets because permission to publish it has not been confirmed. A fuller privacy notice draft is available at `docs/volunteer-privacy-notice-draft.md` and still requires HASH-specific completion and DPO or Philippine privacy-counsel review before publication. The repository contains no confirmed role catalogue, live opportunities, training records, announcements, or volunteer administrator interface.

## Sign-up sheet configuration

Set the following in the deployment environment (or a local, ignored `.env.local` file) for online submissions:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The values are the Supabase project URL and publishable/anon key. Only the publishable/anon key may be exposed to the Vite client. Never use a Supabase service-role key in a `VITE_` variable or browser bundle. The printable sheet remains available when Supabase is not configured.

Apply `supabase/migrations/202610250001_volunteer_portal.sql` and then `supabase/migrations/202610260009_volunteer_interest_signups.sql` to the intended Supabase project for the interest form. The latter creates the sign-up table, insert-only public RLS policy, administrator-only read/delete policies, and an hourly cleanup job for rows whose 14-day expiry has passed. It requires the admin-check function created by the first migration. Verify that the Supabase project supports `pg_cron`, that the cleanup job is active, and that the configured project region/provider details are reviewed before collecting real submissions.

For the separate authenticated volunteer portal, also apply `supabase/migrations/202610260002_staff_auth_user_trigger.sql`. Those accounts are not created by the public sign-up sheet. The portal migration does not seed opportunities, training, or announcements.

The public form can insert a row but cannot read, update, or delete any submission. Only authenticated users with `app_metadata.role = "admin"` can read unexpired rows or delete submissions. HASH staff can review submissions in the Supabase dashboard; no volunteer-sign-up administration page is included. Public form access can attract automated or duplicate submissions, so configure appropriate project/API abuse controls and monitor the table.

If HASH separately enables volunteer accounts, configure Supabase Auth email delivery, redirect URLs, password requirements, and rate limits for that account workflow. The sign-up sheet itself does not create accounts or send email automatically.

## General preferences and inactivity timeout

Apply `supabase/migrations/202610260010_general_preferences.sql` after the volunteer portal migration. It creates the website-wide preferences row with a 60-minute default. Authenticated users can read the timeout setting so both administrator and volunteer sessions use it; only a user with trusted `app_metadata.role = "admin"` can update it. In the Administrator page, open **General preferences** and choose a whole number from 1 to 1440 minutes.

The global auth provider tracks pointer, keyboard, touch, and scroll activity and signs out authenticated sessions after the configured idle period. Activity is shared between tabs in the same browser; the preference is rechecked every minute so an administrator's change applies to already-open sessions within one minute. This is client-side inactivity handling and does not replace suitable Supabase Auth token/session policies.

## Trusted administration

The migration recognizes an administrator only when the authenticated JWT contains `app_metadata.role = "admin"`. This must be granted to named, authorised staff through a trusted server-side Supabase Admin API process after HASH verifies their authority. Do not set it from user-editable `user_metadata`, a browser client, or a registration form. Never deploy the service-role secret to this application.

No staff administration UI is included. HASH must use a controlled server-side/admin workflow to review applications, update application status, publish opportunities and announcements, assign training, record verified activity, and manage resource files. The public sign-up sheet stores only volunteer interest contact details and does not create a volunteer application or account.

## Data and access model

- Profiles and applications are linked to the Supabase Auth user UUID.
- Volunteers can read and update only their own permitted profile and application fields.
- Only approved volunteers can read published opportunities, submit an expression of interest, read restricted training/resources, announcements, and activity.
- Pending applicants can read only their own application/profile and resources explicitly published without an approval requirement.
- Suspended, inactive, and not-approved accounts are restricted in the UI; RLS remains the authoritative data-access boundary.
- Volunteers cannot change application status, opportunity-application decisions, or training completion. Completion and participation records must be entered through the authorised staff process.
- Restricted files belong in the private `volunteer-resources` bucket and should be referenced by their storage path. The portal requests short-lived signed URLs after checking storage access policies. Do not place restricted files in the public static assets directory.
- Do not add HIV status, health records, client/service-user information, counselling notes, or real sensitive personal information to this schema, seed data, logs, screenshots, or tests.

The default interest list is explicitly presented as unconfirmed examples, not established HASH roles. HASH should replace/approve it before treating those selections as a role catalogue.

## Verification checklist for Supabase

Before production, test against a non-production Supabase project using separate test accounts:

1. Submit a volunteer interest form and confirm the row is stored, public users cannot read/update/delete submissions, and an administrator can review/delete unexpired rows.
2. Confirm the cleanup cron job is active and expired submissions are deleted; test the 14-day expiry using a non-production database.
3. Verify public inserts reject missing privacy acknowledgement and invalid field values.
4. If using the separate account portal, confirm a new account creates one profile/application with status `pending_review`, and volunteers cannot change their own status.
5. As an approved volunteer, verify published opportunity access and duplicate-interest prevention; as a different volunteer, verify the first account's records are inaccessible.
6. As an unauthorised user, verify drafts, unpublished resources, application-review notes, and restricted storage objects are inaccessible.
7. Verify only an authorised `app_metadata.role = "admin"` identity can review applications, publish records, change protected statuses, and manage private storage.
8. Verify password-reset, verification, and session-expiry behavior if the separate account portal is enabled.

Frontend tests do not prove database security. Keep these policy checks part of deployment acceptance.

## Implemented routes

Public: `/volunteer`, `/volunteer/register` (online and printable sign-up sheet), `/volunteer/login`, `/volunteer/forgot-password`, and `/volunteer/reset-password`.

Authenticated: `/volunteer/dashboard`, `/volunteer/application`, `/volunteer/profile`, `/volunteer/availability`, `/volunteer/opportunities`, `/volunteer/opportunities/:opportunityId`, `/volunteer/training`, `/volunteer/activity`, `/volunteer/announcements`, `/volunteer/resources`, and `/volunteer/settings`.
