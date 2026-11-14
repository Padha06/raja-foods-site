# Integration and deployment status

The repository root is the existing public website. The `crm/` directory contains
the separate CRM demo and draft backend foundation. The current branch does not
change the public website's source or deployment settings.

## Vercel

Connect a separate CRM Vercel project to this repository, with Root Directory `crm`,
framework Vite, build command `pnpm build`, and output `dist`. Use preview deployments
until production authentication and database transactions are complete. Do not change
the public website project's root directory.

## Supabase setup still pending

1. Connect the intended owner's Supabase account and select its organization.
2. Create a project in an appropriate region after confirming any plan charges.
3. Finish and test the schema and posting functions described in README.md.
4. Apply migrations to a development database, bootstrap the owner, and test role isolation.
5. Integrate Auth, database reads and server-side posting with the UI. Remove demo role
   switching and sample data from production. Do not upload sample records to the live database.
6. Configure private document storage and authenticated downloads.
7. Verify concurrent posting, cross-device persistence, backups and a restore.
8. Set the project URL and publishable key in the CRM Vercel project and validate preview.

The current environment placeholders and SQL foundation are not a functioning backend.
The frontend still stores records in this browser. Production deployment remains pending.
