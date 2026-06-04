import type { PrescreeningResponseRow } from "@/lib/database.types";
import type { PrescreenPortalSnapshot } from "@/lib/portal/dashboard-data";

/**
 * Calendly booking requires legacy prescreen “eligible for booking” and, when an MC
 * prescreening response exists, its `eligible` flag must be true.
 */
export function userCanAccessCalendlyBooking(
  prescreen: PrescreenPortalSnapshot | null | undefined,
  mcPrescreen?: Pick<PrescreeningResponseRow, "eligible"> | null,
): boolean {
  const legacyOk = prescreen?.workflow_status === "eligible_for_booking";
  const mcOk = mcPrescreen == null ? true : mcPrescreen.eligible;
  return Boolean(legacyOk && mcOk);
}
