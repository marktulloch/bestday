import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { CustomerRow, CustomerStatus, PrescreeningResponseRow } from "@/lib/database.types";
import { formatMcPrescreeningResponseLines } from "@/lib/mc-flow/mc-prescreening-format";

export type CustomerAdminListRow = CustomerRow & {
  profile: { email: string | null; full_name: string | null } | null;
};

function sanitizeIlikeTerm(raw: string): string {
  return raw.trim().replace(/[%_]/g, "").slice(0, 80);
}

export async function listCustomersForAdmin(input: {
  search?: string | null;
  status?: CustomerStatus | "all";
  limit?: number;
}): Promise<CustomerAdminListRow[]> {
  const limit = Math.min(input.limit ?? 80, 200);
  const supabase = await createClient();
  const db = looseDb(supabase);

  let userIdFilter: string[] | null = null;
  const term = input.search ? sanitizeIlikeTerm(input.search) : "";
  if (term.length > 0) {
    const { data: profs } = await db
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
      .limit(150);
    const ids = (profs ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return [];
    userIdFilter = ids;
  }

  let q = db.from("customers").select("*").order("created_at", { ascending: false }).limit(limit);

  if (input.status && input.status !== "all") {
    q = q.eq("status", input.status);
  }
  if (userIdFilter) {
    q = q.in("user_id", userIdFilter);
  }

  const { data: customers, error } = await q;
  if (error || !customers?.length) return [];

  const rows = customers as CustomerRow[];
  const userIds = [...new Set(rows.map((c) => c.user_id))];
  const { data: profiles } = await db.from("profiles").select("id, email, full_name").in("id", userIds);
  type ProfileMini = { id: string; email: string | null; full_name: string | null };
  const profileById = new Map<string, { email: string | null; full_name: string | null }>(
    (profiles ?? []).map((p: ProfileMini) => [p.id, { email: p.email, full_name: p.full_name }]),
  );

  return rows.map((c) => ({
    ...c,
    profile: profileById.get(c.user_id) ?? null,
  }));
}

export type CustomerAdminExtras = {
  prescreens: { id: string; workflow_status: string; created_at: string }[];
  mcQuestionnaires: {
    id: string;
    created_at: string;
    eligible: boolean;
    ineligible_reason: string | null;
    summaryLines: string[];
  }[];
  appointments: { id: string; status: string; start_time: string | null }[];
  purchaseOrders: { id: string; status: string; total_cents: number; currency: string; placed_at: string | null }[];
};

export async function getCustomerRelatedForAdmin(
  customerId: string,
  userId: string,
): Promise<CustomerAdminExtras> {
  const supabase = await createClient();
  const db = looseDb(supabase);

  const [prescreensRes, mcRes, apptRes, ordersRes] = await Promise.all([
    db
      .from("prescreens")
      .select("id, workflow_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
    db
      .from("prescreening_responses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
    db
      .from("appointments")
      .select("id, status, start_time")
      .or(`customer_id.eq.${customerId},user_id.eq.${userId}`)
      .order("start_time", { ascending: false })
      .limit(25),
    db
      .from("purchase_orders")
      .select("id, status, total_cents, currency, placed_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const mcRows = (mcRes.data ?? []) as PrescreeningResponseRow[];
  const mcQuestionnaires = mcRows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    eligible: row.eligible,
    ineligible_reason: row.ineligible_reason,
    summaryLines: formatMcPrescreeningResponseLines(row),
  }));

  return {
    prescreens: (prescreensRes.data ?? []) as CustomerAdminExtras["prescreens"],
    mcQuestionnaires,
    appointments: (apptRes.data ?? []) as CustomerAdminExtras["appointments"],
    purchaseOrders: (ordersRes.data ?? []) as CustomerAdminExtras["purchaseOrders"],
  };
}

export async function getCustomerForAdmin(customerId: string): Promise<CustomerAdminListRow | null> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const { data: row } = await db.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (!row) return null;
  const c = row as CustomerRow;
  const { data: prof } = await db.from("profiles").select("id, email, full_name").eq("id", c.user_id).maybeSingle();
  const p = prof as { id: string; email: string | null; full_name: string | null } | null;
  return {
    ...c,
    profile: p ? { email: p.email, full_name: p.full_name } : null,
  };
}
