/**
 * Ticket creation (cases):
 * - Pre-screen: `syncPrescreenCaseTicket` in `./prescreen-case` (service role, one row per prescreen).
 * - Patient portal: `createCustomerSupportTicket` in `app/(portal)/portal/tickets/actions` (RLS).
 * - Staff-only categories (e.g. compliance_review, doctor_followup): insert via admin client or ticket UI.
 */
export { syncPrescreenCaseTicket } from "./prescreen-case";
export type { SyncPrescreenCaseInput } from "./prescreen-case";
