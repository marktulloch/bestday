import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type {
  TicketCategory,
  TicketCommentRow,
  TicketRow,
  TicketStatus,
} from "@/lib/database.types";

export type TicketWithCommentCount = TicketRow & { comment_count: number };

export type StaffTicketFilters = {
  status?: TicketStatus | "all";
  category?: TicketCategory | "all";
  assignee?: "all" | "unassigned" | "me";
  staffUserId?: string;
  /** When true (and status is all), exclude resolved & closed. */
  openOnly?: boolean;
};

export async function listTicketsForAdmin(filters: StaffTicketFilters): Promise<TicketRow[]> {
  const supabase = await createClient();
  let q = looseDb(supabase).from("tickets").select("*").order("updated_at", { ascending: false }).limit(300);

  if (filters.openOnly && (!filters.status || filters.status === "all")) {
    q = q.not("status", "in", "(resolved,closed)");
  }
  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.category && filters.category !== "all") {
    q = q.eq("category", filters.category);
  }
  if (filters.assignee === "unassigned") {
    q = q.is("assigned_to_user_id", null);
  }
  if (filters.assignee === "me" && filters.staffUserId) {
    q = q.eq("assigned_to_user_id", filters.staffUserId);
  }

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as TicketRow[];
}

export async function listTicketsForDoctor(
  doctorUserId: string,
  assignedCustomerIds: string[],
  view: "relevant" | "me" | "waiting_doctor" | "patients",
): Promise<TicketRow[]> {
  const supabase = await createClient();

  if (view === "me") {
    const { data } = await looseDb(supabase)
      .from("tickets")
      .select("*")
      .eq("assigned_to_user_id", doctorUserId)
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as TicketRow[];
  }

  if (view === "waiting_doctor") {
    const { data } = await looseDb(supabase)
      .from("tickets")
      .select("*")
      .eq("status", "waiting_on_doctor")
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as TicketRow[];
  }

  if (view === "patients") {
    if (assignedCustomerIds.length === 0) return [];
    const { data } = await looseDb(supabase)
      .from("tickets")
      .select("*")
      .in("customer_id", assignedCustomerIds)
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as TicketRow[];
  }

  // relevant: assigned to me OR waiting on doctor OR my patients
  const clauses: string[] = [`assigned_to_user_id.eq.${doctorUserId}`, `status.eq.waiting_on_doctor`];
  if (assignedCustomerIds.length > 0) {
    clauses.push(`customer_id.in.(${assignedCustomerIds.join(",")})`);
  }
  const { data } = await looseDb(supabase)
    .from("tickets")
    .select("*")
    .or(clauses.join(","))
    .order("updated_at", { ascending: false })
    .limit(250);

  const rows = (data ?? []) as TicketRow[];
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function listTicketsForCustomer(customerId: string): Promise<TicketRow[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("tickets")
    .select("*")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false });

  return (data ?? []) as TicketRow[];
}

export async function getTicketByIdForStaff(ticketId: string): Promise<TicketRow | null> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase).from("tickets").select("*").eq("id", ticketId).maybeSingle();
  return (data as TicketRow | null) ?? null;
}

export async function getTicketByIdForCustomer(
  customerId: string,
  ticketId: string,
): Promise<TicketRow | null> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("customer_id", customerId)
    .maybeSingle();
  return (data as TicketRow | null) ?? null;
}

export async function listCommentsForTicketStaff(ticketId: string): Promise<TicketCommentRow[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return (data ?? []) as TicketCommentRow[];
}

export async function listCommentsForTicketCustomer(ticketId: string): Promise<TicketCommentRow[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .eq("visibility", "external")
    .order("created_at", { ascending: true });
  return (data ?? []) as TicketCommentRow[];
}

export type StaffProfileOption = { id: string; email: string | null; full_name: string | null; role: string };

/** Service role: staff directory for assignment UI (doctors cannot read all profiles under RLS). */
export async function listStaffAssignees(): Promise<StaffProfileOption[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", ["master", "admin", "doctor"])
    .order("full_name", { ascending: true, nullsFirst: false });
  return (data ?? []) as StaffProfileOption[];
}

export async function fetchProfileSummariesByIds(
  userIds: string[],
): Promise<Map<string, { email: string | null; full_name: string | null }>> {
  const map = new Map<string, { email: string | null; full_name: string | null }>();
  if (userIds.length === 0) return map;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, email, full_name").in("id", userIds);
  for (const p of data ?? []) {
    const row = p as { id: string; email: string | null; full_name: string | null };
    map.set(row.id, { email: row.email, full_name: row.full_name });
  }
  return map;
}

export async function getAssignedCustomerIdsForDoctor(doctorUserId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("doctor_patient_assignments")
    .select("customer_id")
    .eq("doctor_user_id", doctorUserId);
  const rows = (data ?? []) as { customer_id: string }[];
  return rows.map((r) => r.customer_id);
}
