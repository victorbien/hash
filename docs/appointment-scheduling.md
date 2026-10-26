# HASH appointment scheduling

The scheduling module provides confidential staff appointment management and a client-facing booking page for configured appointment types and venues, initially seeded with PrEP, ePrEP, HIV testing, laboratory tests, and self-test kits. It does not provide clinical records, test results, or an OHASIS integration.

The public booking flow is described below; it is intentionally disabled by default.

## Setup

1. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as described in [content-cms.md](./content-cms.md). Never put a service-role key in a Vite variable.
2. Apply all pending migrations in order, including `supabase/migrations/202610260004_scheduling.sql`, `supabase/migrations/202610260005_public_appointment_booking.sql`, `supabase/migrations/202610260007_configurable_scheduling_options.sql`, and `supabase/migrations/202610260008_ordered_default_scheduling_options.sql`. **Migration 007 permanently deletes all existing appointment records and their appointment audit entries.** This was explicitly requested because the existing records are test bookings; do not apply it if any existing appointment data must be retained.
3. Sign in through `/admin/login` with an existing HASH staff account.
4. Grant access using trusted Supabase Auth administration by setting `app_metadata.scheduling_access` to boolean `true`. Accounts with the trusted `app_metadata.role` value `admin` also have scheduling access. Do not set this from the browser or `user_metadata`.
5. Open **Scheduling** from the Administrator dashboard and review the timezone, advance booking window, and working hours before recording real appointments.

The default timezone is `Asia/Manila`, default hours are Monday to Friday, 09:00–17:00, and the default appointment duration is 30 minutes. These defaults must be checked with HASH before production use. In **Scheduling → Settings → Appointment types and venues**, authorised schedulers can add, rename, delete, and reorder appointment types and venues, and set one default of each. The defaults preselect the type and venue on booking and staff appointment forms. They can also set Online eligibility per type and mark one venue as the online venue. The database validates configured type/venue combinations, future dates, the configured advance window and working hours, blocked periods, and overlapping appointments. Time intervals are start-inclusive/end-exclusive; active appointments reserve their venue, and a database transaction lock plus server-side conflict checks protect concurrent saves. Renaming or deleting an option does not rewrite saved appointment or blocked-period labels; deleted options are removed from new choices.

Appointment records and blocked periods are private under row-level security. The scheduling tables are accessible only to an administrator or a user with trusted scheduling access. A block that overlaps an existing scheduled or confirmed appointment preserves that record and marks it `rescheduling_required`; it does not automatically cancel or move the appointment. Appointments begin as `scheduled`, not confirmed. Status changes and administrative edits are audit logged.

## Current scope and operational limitations

- The calendar provides month, week, day, and agenda views, backed by database records.
- `/schedule` provides client-facing, immediate booking from available 15-minute-start slots. A successful booking is confirmed immediately, and the client receives a reference on screen. The client form requires first and last name; email and phone are optional, per the current workflow decision. The database returns availability and accepts bookings through narrow RPC functions; it does not expose appointment rows or existing client data to anonymous visitors.
- Public booking is off by default. An authorised scheduler can enable it in Scheduling Settings. Before enabling, HASH must approve the immediate-confirmation policy, clinic hours, capacity assumptions, privacy/retention policy, and add production anti-abuse protections (such as a verified CAPTCHA and request rate limiting at the trusted backend/edge). The current honeypot is only a supplementary signal, not a substitute for those controls.
- Public booking does not send email or SMS. The confirmation page says so and clients are asked to retain their reference and contact HASH through its official channels if they need changes.
- Staff can create, edit, reschedule, cancel, complete, and mark appointments as no-show. Cancellation is retained as a status and reason, not deleted.
- Staff can add all-day, venue-specific, and all-venue blocks. Staff-specific blocks and recurring rules are not implemented.
- Venue capacity is treated as one appointment at a time. Staff assignment, staff-specific capacity, venue-specific business hours, retention automation, and bulk export are not implemented.
- Working hours are currently one organization-wide JSON schedule, editable in Scheduling Settings. A missing weekday means closed.
- Notification recipient addresses can be stored, but email sending, retry queues, client confirmations, and administrator alerts are **not configured or implemented**. The UI does not claim that a message has been sent.
- Google Calendar synchronisation is **not configured or implemented**. Appointment information remains in Supabase and is not sent to a Google calendar.
- The database migration has not been applied or integration-tested against HASH's live Supabase project.

Do not enter clinical details, HIV status, test results, or counselling notes in appointment fields. Use internal notes only for necessary operational information. Before production, HASH must approve staff access, the immediate booking policy, timezone and operating hours, appointment retention, email recipients/provider, and any calendar-sharing policy. Google events, if added in a future implementation, should use neutral titles and minimum necessary information.
