# Best Day — Backend & Portal Implementation Checklist

Living document. Update checkboxes as phases complete.

## Phase 0 — Discovery & architecture (current)

- [x] Map existing Next.js app structure and routes
- [x] Document gaps (auth, API, DB, portal)
- [x] Agree target architecture (Supabase + Google + Calendly)
- [ ] Stakeholder sign-off on data model boundaries (PII vs clinical notes)

## Phase 1 — Foundation (Supabase + auth + RBAC shell)

- [x] Add Supabase dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Environment variables documented (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- [x] SQL migrations: `profiles`, `app_role` enum, RLS, `audit_logs` — see `supabase/migrations/20260403120000_phase1_profiles_audit.sql` (apply in Supabase SQL editor or CLI)
- [x] Auth UI: magic link sign-in at `/login`, callback at `/auth/callback`
- [x] `middleware.ts`: refresh session, protect `/portal/*`, `/admin/*` (master|admin), `/doctor/*` (doctor|admin|master)
- [x] Route groups: `(marketing)` + `(auth)` + `(portal)` + `(staff)`; marketing keeps Header/Footer in group layout
- [x] Server-side Supabase client (`lib/supabase/server.ts`), browser client (`lib/supabase/client.ts`), admin client (`lib/supabase/admin.ts`)
- [x] Audit helper `lib/audit/server.ts` (service-role insert into `audit_logs`)

## Phase 2 — Pre-screen & lead/customer records

- [x] Schema: `leads`, `customers`, `prescreens`, `role_assignments` (see migration `20260404120000_...`)
- [ ] Wire prescreen server action to `leads` + `prescreens` (service role) and eligibility
- [ ] Prescreen server action: validate with Zod, insert/update lead, eligibility flags
- [ ] Post-submit UX: eligible → booking CTA; ineligible → clear messaging (no dead redirect)
- [ ] Optional: Google Form or Sheet sync (if used for ops); prefer DB as source of truth

## Phase 3 — Booking (Calendly) + reminders

- [ ] Calendly: embed or scheduling links per practitioner/product
- [ ] Webhook route: verify signature, store `bookings` / `appointments` with external IDs
- [ ] Reminders: email via Gmail API or transactional provider (decision recorded in env)
- [ ] Google Calendar: create/update events for confirmed bookings (service account or user OAuth)

## Phase 4 — Doctor workflow

- [ ] Schema: consultations, clinical notes (access-controlled), recommendation records
- [ ] Doctor portal routes: patient list (assigned), consultation detail, recommendation UI
- [ ] RLS: doctors see only assigned/authorised patients

## Phase 5 — Catalogue, recommendations, orders

- [ ] Schema: `products`, `product_recommendations`, `orders`, `order_items`, statuses
- [ ] Customer portal: view approved recommendations, checkout flow
- [ ] Admin: fulfilment status updates, carrier/tracking fields

## Phase 6 — Support tickets

- [ ] Schema: `tickets`, messages, status, priority, assignment
- [ ] Customer: create/view own tickets; staff: queue + assignment
- [ ] Optional Gmail threading reference (store `message_id` for traceability)

## Phase 7 — Admin dashboard & Master overrides

- [ ] Admin overview: users, orders, bookings, tickets
- [ ] Master role: elevated policies (documented), break-glass audit entries
- [ ] Google Drive/Docs: generate or link consultation summaries (phase as needed)

## Phase 8 — Hardening & production

- [ ] Rate limiting on public actions (prescreen, auth)
- [ ] Security review: RLS coverage, service role usage minimised
- [ ] NZ privacy: retention, export, delete requests (process + minimal schema support)
- [ ] Monitoring: Supabase logs + app error boundary
- [ ] Add missing legal routes or fix footer links (`/privacy`, `/terms`)

---

_Last updated: 2026-04-03 (Phase 1 implemented in repo)_
