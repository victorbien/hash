# HASH website CMS

The CMS extends the existing React, Supabase Auth, Postgres, and Storage setup. It uses a shared `cms_content` table for About, service, resource, volunteer-public-information, and homepage content. Content bodies are plain text; the public site renders them as text and does not interpret stored HTML or scripts. When Supabase is not configured, the current public pages remain available. Once CMS access is configured, public CMS areas show only published database content; an empty or unavailable CMS does not fall back to hard-coded service or resource items.

## Setup

1. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the existing Supabase project. Never expose a service-role key to the Vite client.
2. Apply all required migrations in filename order: volunteer portal, `202610260001_content_cms.sql`, `202610260002_staff_auth_user_trigger.sql`, `202610260003_seed_initial_cms_content.sql`, `202610260004_scheduling.sql`, `202610260005_public_appointment_booking.sql`, and `202610260006_expand_history_milestones.sql`. The CMS schema migration seeds the initial entries on a fresh setup; the seed and history migrations add content to projects where the CMS schema migration was already applied. Do not rerun already-applied migrations; apply only pending migrations.
3. Through a trusted server-side Supabase Admin API process, assign `app_metadata.role` to authorised staff. Supported values are `admin`, `publisher`, `editor`, and `volunteer_coordinator`. Never accept a role from user metadata, a browser request, or a registration form.
4. Sign in at `/admin/login`. The `/admin` routes require a signed-in user with a supported role; database RLS policies independently enforce content and media access.
5. Review the initial copy migrated from the previous public React pages. Existing About, homepage, service, volunteer-introduction, and HIV 101 copy is seeded as published to keep the site populated. Previous impact figures, the annual-report listing, and training-material listing are seeded as drafts pending HASH verification and, for documents, approved files.

Published CMS items replace the corresponding About, service, resource, and volunteer-public-information listings. The History page reads published About entries in the `Key milestones` category; those entries are linked from About and displayed as the detailed timeline. The history expansion migration summarises the milestones in the supplied HASH timeline PDF; targets are labelled as targets rather than completed outcomes. The first published homepage item supplies the homepage hero title, summary, and optional image; subsequent items appear as homepage sections. Service and resource detail URLs use `/services/:slug` and `/resources/:slug`.

## Roles and data boundaries

- `admin` and `publisher` may create, edit, publish, unpublish, archive, and delete CMS content.
- `editor` may create and edit drafts only. Editors cannot change published or archived records or publish content.
- `volunteer_coordinator` may manage volunteer-public-information drafts only. This role does not grant access to private volunteer profiles, applications, or portal records.
- Public database reads are limited by RLS to published content. Draft and archived records are not publicly selectable.
- CMS media is stored in a private bucket. The database enforces a 10 MB maximum and JPEG, PNG, WebP, and PDF MIME allow-list. Public signed links are available only for media referenced by published content; staff with relevant CMS permissions can access draft media.
- Content updates create a prior-version snapshot and an audit entry. Audit log reads are limited to administrators. The UI does not currently expose revision restore or audit-log browsing.

## Current scope and operational checks

The initial seed copies existing repository copy; it has not been independently verified against HASH source documents. Review the published historical and service claims with HASH and correct or unpublish them if needed. The admin dashboard presents simple entry points for Pages, Services, Resources, Volunteers, and media attached to content, plus database-backed counts and recently updated items. User-role assignment remains a trusted server-side Supabase operation; revision snapshots are recorded but there is no revision-browsing interface yet. The content list supports search and filters; the editor supports create/edit, draft preview, publishing controls for publishers, and uploads. Public retrieval is isolated in `src/cms/content.ts`; public pages do not query tables directly. Upload replacement or removal only detaches a file from content; orphaned private storage objects need periodic trusted cleanup. Scheduled publishing, slug redirects, an independent media-library browser, and revision restore are not included in this initial implementation.

Before production, test RLS and Storage policies against a non-production Supabase project with separate anon, editor, publisher, coordinator, and administrator accounts. Confirm that direct API requests cannot publish an editor's draft, read a draft as a public visitor, access another user’s private volunteer records, or fetch unreferenced draft media. Frontend tests alone do not verify Supabase policies. HASH should also review all existing public website copy and confirm approvals before migrating it into the CMS.

## Assign a staff role with the included script

The repository-root `set-cms-role.mjs` script updates only the selected user's `app_metadata.role` and preserves other app metadata. From **Authentication → Users**, copy the staff user's UUID, then create a local, ignored `.env.local` file in the repository root:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
```

Use the project URL and service-role secret from Supabase project settings. The service-role secret bypasses Row Level Security; keep it local, never prefix it with `VITE_`, never commit it, and never paste it into chat. Run this command from the repository root:

```powershell
node --env-file=.env.local .\set-cms-role.mjs <user-uuid> admin
```

Replace `<user-uuid>` with the copied UUID and choose only the role authorised for that staff member. After the script succeeds, sign out of the site and sign in again. The script assigns a role to an existing Auth user; it does not create the account or set its password.
