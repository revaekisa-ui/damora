# Admin user management

This function creates Supabase Auth accounts, changes passwords, and deletes accounts for Admin users. It uses the platform-provided `SUPABASE_SERVICE_ROLE_KEY` only on the Edge Function runtime; do not expose that key to the browser.

Deploy the database migration before deploying the function, because the function no longer writes passwords to `public.users`. This project has no Supabase migration-history table, so apply this migration directly instead of running `db push` (which could replay older SQL files):

```sh
supabase db query --linked --project-ref YOUR_PROJECT_REF --file supabase/migrations/20261006100000_remove_legacy_password_from_users.sql
supabase functions deploy admin-users --project-ref YOUR_PROJECT_REF
```

The invoking user must have a valid Supabase Auth session and an `Admin` role in `public.users`.
