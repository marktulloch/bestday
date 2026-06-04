# MVP handover checklist — Best Day portal

Use this list before go-live or when handing the repo to another team. Check items off as you verify them in **staging** (with production-like env vars).

## Environment and secrets

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (required for auth and data).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set server-side only (prescreen funnel, audit logs, cron, some jobs).
- [ ] `NEXT_PUBLIC_SITE_URL` matches the deployed origin (magic links, auth redirects, email links).
- [ ] `NEXT_PUBLIC_CALENDLY_BOOKING_URL` points to the correct Calendly event or scheduling page.
- [ ] `CALENDLY_WEBHOOK_SIGNING_KEY` set; webhook URL points to `/api/webhooks/calendly` on the deployed host.
- [ ] **Never** enable `CALENDLY_SKIP_WEBHOOK_VERIFY` in production.
- [ ] Email: `RESEND_API_KEY` + `RESEND_FROM_EMAIL` **or** Gmail path (`GMAIL_API_MAILER`, Workspace delegation, `docs/google-workspace.md`).
- [ ] Cron: external scheduler (e.g. Vercel Cron) calls `GET` or `POST` `/api/cron/notifications` with `Authorization: Bearer <CRON_SECRET>` (or `NOTIFICATIONS_CRON_SECRET`).
- [ ] Optional ops: Google Sheets export per `docs/google-workspace.md` if staff should create spreadsheets from admin exports.
- [ ] `.env.example` reviewed; no secrets committed.

**Important:** If Supabase public env vars are **missing**, middleware and some server guards **do not enforce auth** (`lib/supabase/middleware.ts`, `lib/auth/guards-server.ts`). Treat missing config as a failed deploy, not a supported mode.

## Auth and roles

- [ ] Sign up, login (password), magic link (if enabled), forgot password, sign out.
- [ ] `/auth/callback` and `/auth/after-signin` redirect correctly after OAuth/magic link.
- [ ] Logged-in users cannot use marketing-only auth pages inappropriately (middleware redirects).
- [ ] `/portal` requires a session; `/portal/care` requires role `customer` (staff redirected to `/portal`).
- [ ] `/admin` requires `master` or `admin` (middleware + `app/(staff)/admin/layout.tsx` `requireRoles`).
- [ ] `/doctor` requires `doctor`, `admin`, or `master`.
- [ ] `/api/admin/exports` returns 401/403 for anonymous or non-admin users.

## Marketing and prescreen

- [ ] Prescreen step 1 and 2 submit successfully; cookies `bestday_prescreen_id` / lead cookie behave across steps.
- [ ] Eligibility outcomes match expectations (`lib/prescreen/eligibility`): ineligible, review, eligible for booking.
- [ ] Complete page shows correct outcome query param.
- [ ] Service role available for prescreen actions; without it, user sees config error (not a silent failure).
- [ ] Prescreen case tickets: background sync must **not** block the patient journey; failures are logged in development only (`app/(marketing)/prescreen/actions.ts`).

## Booking and reminders

- [ ] Portal booking page loads Calendly embed when URL is configured; shows helpful message when not.
- [ ] Calendly webhook creates/updates/cancels appointments in Supabase (`lib/booking/reconcile-calendly-webhook.ts`).
- [ ] Appointment reminder rows are scheduled on relevant lifecycle events; cron processes due notifications (`lib/notifications/process-due-notifications.ts`).
- [ ] Test at least one reminder email (or `NOTIFICATIONS_FORCE_LOG_ONLY=true` in dev and confirm logs).

## Commerce (MVP limitations)

- [ ] Portal cart and checkout are **customer-only**; non-customers hitting checkout redirect to `/portal`.
- [ ] Payment is **placeholder** (`lib/payments`); confirm product/stakeholder expectations before promising real charges.
- [ ] Admin **Orders** list at `/admin/orders` is the canonical purchase-order UI; `/admin/purchase-orders` redirects here.

## Fulfilment and delivery

- [ ] Admin can update purchase order status and fulfilment (courier, dispatch) and changes persist + audit.

## Doctor workflow

- [ ] Doctor can open assigned patients and tickets; actions respect `requireRoles` / doctor guard.
- [ ] No unintended access to other customers’ clinical data (spot-check RLS in Supabase dashboard).

## Products and access rules

- [ ] Portal product list respects catalogue flags and per-customer approvals (smoke-test approved vs unapproved SKUs).
- [ ] Admin product CRUD and approvals flows work for `master`/`admin`.

## Ticketing

- [ ] Portal: customer can create and view support tickets.
- [ ] Admin/doctor ticket lists and detail pages load; assignment and status updates work.

## Admin dashboard and exports

- [ ] Admin home metrics and widgets load without server errors.
- [ ] CSV export links on list pages download and open cleanly in Excel/Google Sheets (UTF-8 BOM).
- [ ] Google Sheet button behaves per Workspace configuration (502 + message when misconfigured).

## Mobile and UX

- [ ] Spot-check key flows on a narrow viewport: prescreen, portal nav, checkout, admin sidebar (horizontal scroll on small screens).
- [ ] Loading: forms use `useTransition` / disabled states where implemented; add `loading.tsx` for heavy routes if needed.
- [ ] Error boundaries: e.g. `app/(portal)/portal/error.tsx` shows sensible messaging; production hides stack traces.

## Security and compliance

- [ ] RLS policies in Supabase reviewed for `profiles`, `customers`, `prescreens`, `purchase_orders`, `tickets`.
- [ ] Service role used only on server; never exposed to the client.
- [ ] Webhook and cron endpoints authenticated (signature / bearer secret).

## Codebase hygiene (post–MVP QA pass)

- [ ] `PRESCREEN_REASON_CODES` used consistently (typo `PREScreen_*` removed).
- [ ] Unused RBAC helpers removed (`canAccessCrmRoute` removed if not needed).
- [ ] `looseDb` remains `any` by design until generated types match PostgREST embeds; document before tightening.

## Smoke test script (30 minutes)

1. Anonymous prescreen → eligible outcome → sign up → portal.
2. Book via Calendly (or simulate webhook in dev).
3. Add to cart → checkout → placeholder payment path.
4. Admin: confirm order, set fulfilment.
5. Open ticket from portal; resolve from admin.
6. Doctor: open one patient and one ticket.
7. Run cron once; confirm no 401 and notifications log or send.

---

**Sign-off**

| Role        | Name | Date | Notes |
|------------|------|------|-------|
| Engineering |      |      |       |
| Product     |      |      |       |
| Clinical/Ops|      |      |       |
