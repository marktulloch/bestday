import { createAdminClient } from "@/lib/supabase/admin";

import { FUNNEL_LEAD_COOKIE, FUNNEL_PRESCREEN_COOKIE } from "./funnel-constants";

type CookieAdapter = {
  get: (name: string) => { value: string } | undefined;
  delete: (name: string) => void;
};

/**
 * Attach anonymous prescreen / lead records to the authenticated user (service role).
 * Clears funnel cookies when done.
 */
export async function linkFunnelRecordsToUser(
  userId: string,
  email: string | undefined,
  cookieStore: CookieAdapter,
): Promise<void> {
  const prescreenId = cookieStore.get(FUNNEL_PRESCREEN_COOKIE)?.value;
  const leadId = cookieStore.get(FUNNEL_LEAD_COOKIE)?.value;
  const emailNorm = email?.trim().toLowerCase();

  try {
    const admin = createAdminClient();

    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (prescreenId) {
      await admin
        .from("prescreens")
        .update({ user_id: userId })
        .eq("id", prescreenId)
        .is("user_id", null);
    }

    if (leadId) {
      await admin
        .from("leads")
        .update({
          converted_user_id: userId,
          ...(customer?.id ? { converted_customer_id: customer.id } : {}),
        })
        .eq("id", leadId);

      await admin
        .from("prescreens")
        .update({ user_id: userId })
        .eq("lead_id", leadId)
        .is("user_id", null);
    }

    if (emailNorm) {
      const { data: leadsByEmail } = await admin
        .from("leads")
        .select("id")
        .eq("email", emailNorm)
        .is("converted_user_id", null);

      for (const row of leadsByEmail ?? []) {
        await admin
          .from("leads")
          .update({
            converted_user_id: userId,
            ...(customer?.id ? { converted_customer_id: customer.id } : {}),
          })
          .eq("id", row.id);

        await admin
          .from("prescreens")
          .update({ user_id: userId })
          .eq("lead_id", row.id)
          .is("user_id", null);
      }
    }
  } catch {
    /* non-fatal: user can still use portal */
  } finally {
    cookieStore.delete(FUNNEL_PRESCREEN_COOKIE);
    cookieStore.delete(FUNNEL_LEAD_COOKIE);
  }
}
