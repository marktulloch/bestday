import type { Json, TicketPriority } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type SyncPrescreenCaseInput = {
  prescreenId: string;
  leadId: string | null;
  createdByUserId: string | null;
  emailLabel: string;
  workflowStatus: string;
  reasonCodes?: string[];
  decisionSummary?: string | null;
};

/**
 * Ensures one support case per prescreen (unique prescreen_id). Uses service role.
 */
export async function syncPrescreenCaseTicket(admin: AdminClient, input: SyncPrescreenCaseInput): Promise<void> {
  let customerId: string | null = null;
  if (input.createdByUserId) {
    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", input.createdByUserId)
      .maybeSingle();
    customerId = customer?.id ?? null;
  }

  const ticketPriority: TicketPriority =
    input.workflowStatus === "ineligible" ? "low" : "normal";

  const subject = `Pre-screen: ${input.emailLabel} (${input.workflowStatus})`;

  const metadata: Json = {
    source: "prescreen_auto",
    workflow_status: input.workflowStatus,
    prescreen_id: input.prescreenId,
    reason_codes: input.reasonCodes ?? [],
    ...(input.decisionSummary != null && input.decisionSummary !== ""
      ? { decision_summary_admin: input.decisionSummary }
      : {}),
  };

  const now = new Date().toISOString();

  const { error } = await admin.from("tickets").upsert(
    {
      prescreen_id: input.prescreenId,
      lead_id: input.leadId,
      customer_id: customerId,
      created_by_user_id: input.createdByUserId,
      subject,
      status: "new",
      priority: ticketPriority,
      category: "prescreen_case",
      metadata,
      updated_at: now,
    },
    { onConflict: "prescreen_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
