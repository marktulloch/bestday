# Recommended Phase 2 roadmap — Best Day portal

Priorities assume MVP is live with placeholder payments, Calendly booking, email reminders, and manual fulfilment. Order is indicative; adjust for regulatory and commercial pressure.

## 1. Payments and checkout hardening

- Integrate a real PSP (e.g. Stripe): payment intents, webhooks for `paid` / failed, idempotent order updates.
- Replace `capturePlaceholderPayment` with production capture/refund flows.
- PCI posture: no card data on origin; use hosted fields or checkout session.
- Customer-facing receipts and admin payment visibility.

## 2. Notifications and scheduling

- Vercel `vercel.json` cron (or equivalent) committed and documented so `/api/cron/notifications` cannot be forgotten.
- Retry/backoff for failed notification sends; dead-letter or admin visibility for failures.
- SMS or additional channels if clinical workflows require them (opt-in, compliance).

## 3. Prescreen and CRM

- Staff queue UX: SLA timers, bulk actions, clearer decision log diffing.
- Optional: surface ticket sync failures to staff (dashboard banner) without blocking patients.
- Lead/prescreen analytics export automation (beyond manual CSV).

## 4. Booking and calendar

- Two-way calendar hygiene: conflict detection, cancellation policy copy, timezone tests.
- Patient self-service reschedule rules aligned with Calendly configuration.

## 5. Fulfilment and logistics

- Courier API integrations (tracking webhooks → `purchase_order_fulfilment` and patient-visible status).
- Partial shipments and return flows if product mix requires it.

## 6. Doctor workspace

- Richer consultation notes templates, structured data for audits.
- Task inbox across patients (not only ticket list).

## 7. Type safety and data layer

- Regenerate or patch Supabase types so embedded selects (`products` → `product_categories`, etc.) type-check; then replace `looseDb`’s `any` with a typed client or targeted assertions.
- Stricter Zod boundaries at server actions (already started on prescreen).

## 8. Observability

- Structured logging (request id, user id hash) for server actions and webhooks.
- Error tracking (Sentry or similar) with PII scrubbing.
- Uptime checks on `/api/webhooks/calendly` (HEAD/health) only if you add a dedicated health route—do not hit signed endpoints blindly.

## 9. Portal “care” and education

- Replace placeholder `app/(portal)/care/page.tsx` with condition-specific content or links to approved resources.
- Accessibility audit (WCAG 2.1 AA) on prescreen and checkout.

## 10. Admin and compliance

- Role change workflow UI (if not already complete) with audit trail review screens.
- Data export / deletion requests (GDPR-style) wired to Supabase and Drive if you store documents in Google Drive.

---

**Sizing hint:** Phases 1–2 are typically one increment each; 3–5 depend on ops volume; 6–10 are ongoing platform work. Revisit this roadmap after the first month of production traffic.
