import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { getLatestMcPrescreeningResponseForUser } from "@/lib/mc-flow/prescreening-queries";

/** Latest MC prescreen marks the patient ineligible for commerce flows. */
export async function mcPrescreenBlocksPortalCommerce(userId: string): Promise<boolean> {
  const row = await getLatestMcPrescreeningResponseForUser(userId);
  if (!row) return false;
  return !row.eligible;
}

export function mcPrescreenCommerceBlockPublicMessage(): string {
  return MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE;
}
