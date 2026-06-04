# Security hardening and audit (Prompt 17)

This document summarizes controls for Best Day and **recommended** next steps. It is not a penetration-test report.

## Audit logging

- **Table:** `public.audit_logs` (append-only). Application code inserts via **service role** in `logAuditEvent()` (`lib/audit/server.ts`).
- **Immutability:** Migration `20260417120000_audit_logs_rls_immutable.sql` blocks `UPDATE`/`DELETE` on `audit_logs`.
- **Read access:** Masters may `SELECT` audit rows under RLS (`audit_logs_select_master`).
- **Action names:** Use `AUDIT_ACTION` in `lib/audit/actions.ts` so reporting stays stable.

### Events currently written

| Area | Action(s) |
|------|-----------|
| Roles | `role_changed` (after successful `set_user_role` RPC, `lib/supabase/set-user-role.ts`) |
| Pre-screen | `prescreen_workflow_updated` (eligibility outcome after step 2 submit) |
| Bookings | `booking_calendly_sync` (Calendly webhook reconcile — system actor) |
| Clinical notes | `consultation_note_created` (insert only; **no update path** in app yet) |
| Recommendations | `consultation_recommendation_created` |
| Product lines (clinical) | `customer_order_created`, `customer_order_status_updated` |
| Product approvals | `customer_product_approval_upserted` |
| Purchase orders (admin) | `purchase_order_status_admin`, `purchase_order_fulfilment_admin` (with before/after metadata) |
| Purchase orders (patient) | `purchase_cart_line_added`, `purchase_order_submitted`, `purchase_order_paid_placeholder`, `purchase_order_cancelled_by_patient` |
| Tickets (staff) | `ticket_updated_staff`, `ticket_comment_added` |
| Tickets (portal) | `ticket_created_portal`, `ticket_comment_added` (metadata `channel: portal`) |
| Customers (admin) | `customer_record_updated` |
| Products (admin) | `product_created`, `product_updated`, `product_deleted`, `product_category_created` |
| Doctor assignments | `doctor_patient_assigned`, `doctor_patient_unassigned` |

**Also:** `role_assignments` rows are created inside `set_user_role()` for a SQL-level history.

## Route and middleware guards

- **Middleware** (`lib/supabase/middleware.ts`): Refreshes Supabase session; redirects unauthenticated users away from `/portal`, `/admin`, `/doctor`; enforces `canAccessAdminRoute` / `canAccessDoctorRoute` by profile role.
- **Layouts:** `/admin` uses `requireRoles(["master","admin"])`, `/doctor` uses `requireDoctorWorkspace`, `/portal/care` uses `requireRoles(["customer"])`.
- **Server actions:** Sensitive staff actions now call `requireRoles(...)` at the top (defense in depth with RLS): admin customer + purchase order + product mutations, doctor clinical actions, ticket staff actions, product approvals.

## Server-side validation (review)

- Staff and portal **server actions** use **Zod** for IDs (UUID), enums, and string length bounds on primary inputs.
- **Webhook:** Calendly route verifies HMAC unless explicitly skipped in non-production; cron requires `Authorization: Bearer` + `CRON_SECRET`.
- **Gaps / recommendations:** Add validation middleware for any new public API routes; centralize max body size at the edge for webhooks.

## Rate limiting (recommendations)

Apply at **edge** or **API gateway** (Cloudflare, Vercel Firewall, AWS WAF, etc.):

| Surface | Suggestion |
|---------|------------|
| `POST /api/webhooks/calendly` | Per-IP + global cap; already signature-verified |
| `POST /api/cron/notifications` | IP allowlist or single secret; no browser calls |
| `POST` prescreen server actions | Per-IP throttle + CAPTCHA if abuse appears |
| Auth (`/login`, magic links) | Provider limits + same-origin checks; throttle by IP |
| Public marketing forms | Low burst limits |

Next.js middleware can implement a simple in-memory token bucket **only on a single instance**; for production use a shared store (Redis) or hosted WAF.

## Data leakage and internal notes

- **Ticket comments:** `listCommentsForTicketCustomer` filters `visibility = 'external'` (`lib/tickets/queries.ts`). Staff UI distinguishes internal vs external (`StaffTicketWorkspace`).
- **Consultation notes / recommendations:** RLS restricts to clinical roles; **customer profile 360** does not load note bodies for the patient (`profileVisibilityForRole` + loader skips queries).
- **Pre-screen internals:** Patient view omits decision log and admin summary in the shared profile loader; full detail only for staff.
- **Staff directory:** `listStaffAssignees` uses the service role for assignment dropdowns — call only from authenticated staff routes.

## Checklist of improvements made (this pass)

1. Centralized **`AUDIT_ACTION`** constants and documented event types.
2. **`logAuditEvent`** dev warnings on insert failure (no user-facing throw).
3. **Role changes:** application audit after `setUserRole()` with `from_role` / `to_role`.
4. **Pre-screen:** audit on workflow transition after step 2 save.
5. **Bookings:** audit on successful Calendly-driven appointment create/update paths.
6. **Portal tickets:** audit on ticket create and patient follow-up comments (no subject/body in metadata).
7. **Admin orders:** audit includes **previous** purchase order status; fulfilment already logged field-level deltas.
8. **Admin customers:** audit before/after snapshot; **`requireRoles`** on the action.
9. **RLS:** masters can read `audit_logs`; trigger prevents mutating audit rows.
10. **Server actions:** **`requireRoles`** on admin/doctor/staff mutations listed above.
11. **This doc** + middleware comment pointing here for rate limiting.

## Follow-ups (not done here)

- UI for masters to **browse** `audit_logs` in `/admin`.
- **Consultation note edit** flow + `consultation_note_updated` audit if product adds edits.
- **Manual prescreen override** by admin (if added) should log `prescreen_manual_override` with actor and reason.
- **Automated security headers** (`next.config` CSP, HSTS at CDN).
- **Dependency audit** in CI (`npm audit`, Supabase advisor).
