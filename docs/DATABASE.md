# Database and authentication

## Environment variables

Copy `.env.example` to `.env.local` (never commit secrets).

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS — audit logs, webhooks, seed script, anonymous prescreen writes |
| `NEXT_PUBLIC_SITE_URL` | Public | Absolute base URL for magic-link redirects (e.g. `http://localhost:3000`) |
| `MASTER_SEED_EMAIL` | Local / CI only | Target email for `npm run seed:master` |
| `MASTER_SEED_PASSWORD` | Local / CI only | Initial password for that user |

In production hosting (e.g. Vercel), set the same keys in the project environment settings.

## Migrations

Apply SQL in order:

1. `supabase/migrations/20260403120000_phase1_profiles_audit.sql`
2. `supabase/migrations/20260404120000_customers_leads_prescreens_role_assignments.sql`

In the Supabase Dashboard: **SQL Editor** → paste each file → run.  
Or use the Supabase CLI: `supabase db push` from a linked project.

After migrations, enable **Email** auth and add redirect URLs:

- `NEXT_PUBLIC_SITE_URL/auth/callback`
- Production URL equivalent

## Master user bootstrap

1. Run migrations (triggers create `profiles` and `customers` for new sign-ups).
2. Set `MASTER_SEED_EMAIL`, `MASTER_SEED_PASSWORD`, service role, and URL in `.env.local`.
3. Run:

```bash
npm run seed:master
```

If the user already exists, the script resolves them via `listUsers` and promotes the profile to `master`, inserting a `role_assignments` row.

For ongoing role changes in production, prefer the `set_user_role()` RPC (master-only, audited) from a trusted server action. The helper `lib/supabase/set-user-role.ts` wraps that RPC for App Router server code.

## Route protection strategy

| Layer | Responsibility |
|--------|----------------|
| **Middleware** (`middleware.ts`) | Refresh Supabase session; redirect unauthenticated users away from `/portal`, `/admin`, `/doctor`; enforce coarse role routing (admin vs doctor). |
| **Server layouts** (`requireAuth`, `requireRoles` in `lib/auth/guards-server.ts`) | Defense in depth so UI trees do not drift from middleware rules. Skips checks when Supabase env vars are missing (local misconfiguration only — not for production). |
| **RLS** | Authoritative data access for all JWT-backed PostgREST queries. |

## TypeScript types

`lib/database.types.ts` defines the `Database` generic passed to Supabase clients. Regenerate when the schema changes (or align manually with migrations).

## Role helpers

Use `lib/auth/rbac.ts` for predicates shared by middleware, server components, and future API routes. Use `lib/auth/session.ts` for `getAuthUser`, `getCurrentProfile`, and `getAuthContext`.

## Customer-only example route

`/care` uses `requireRoles(['customer'])`. Staff accounts are redirected to `/portal`. Build patient-specific features here as needed.
