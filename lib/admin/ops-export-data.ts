import "server-only";

import type {
  AppointmentStatus,
  CustomerRow,
  CustomerStatus,
  PrescreenWorkflowStatus,
  PurchaseOrderRow,
  TicketCategory,
  TicketRow,
  TicketStatus,
} from "@/lib/database.types";
import type { OperationalRow } from "@/lib/google/export-operational";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

import type { OpsExportKind } from "./ops-export-kinds";

export type { OpsExportKind } from "./ops-export-kinds";

export const MAX_OPS_EXPORT_ROWS = 5000;

const CELL_MAX = 30_000;

function jsonCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function truncateCell(s: string): string {
  if (s.length <= CELL_MAX) return s;
  return `${s.slice(0, CELL_MAX - 1)}…`;
}

function sanitizeIlikeTerm(raw: string): string {
  return raw.trim().replace(/[%_]/g, "").slice(0, 80);
}

const CUSTOMER_STATUSES = new Set<CustomerStatus | "all">(["all", "draft", "active", "archived"]);

const WORKFLOWS: (PrescreenWorkflowStatus | "all")[] = [
  "all",
  "draft",
  "submitted",
  "eligible_for_booking",
  "needs_manual_review",
  "ineligible",
];

const APPT_STATUSES: (AppointmentStatus | "all")[] = [
  "all",
  "scheduled",
  "rescheduled",
  "cancelled",
  "completed",
  "no_show",
];

const TICKET_STATUSES = new Set<TicketStatus>([
  "new",
  "in_progress",
  "waiting_on_customer",
  "waiting_on_doctor",
  "resolved",
  "closed",
]);

const TICKET_CATEGORIES = new Set<TicketCategory>([
  "prescreen_case",
  "booking_support",
  "doctor_followup",
  "order_issue",
  "delivery_issue",
  "customer_support",
  "compliance_review",
]);

const PENDING_ORDER_STATUSES = new Set([
  "awaiting_payment",
  "paid",
  "awaiting_fulfilment",
  "packed",
  "dispatched",
]);

export type OpsExportPayload = {
  title: string;
  headers: readonly string[];
  rows: OperationalRow[];
};

function todayTitlePart(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadOpsExportData(
  kind: OpsExportKind,
  searchParams: URLSearchParams,
  ctx: { staffUserId: string },
): Promise<OpsExportPayload | { error: string }> {
  switch (kind) {
    case "customers":
      return exportCustomers(searchParams);
    case "prescreens":
      return exportPrescreens(searchParams);
    case "appointments":
      return exportAppointments(searchParams);
    case "orders":
      return exportOrders(searchParams);
    case "tickets":
      return exportTickets(searchParams, ctx.staffUserId);
    default:
      return { error: "invalid_kind" };
  }
}

async function exportCustomers(sp: URLSearchParams): Promise<OpsExportPayload> {
  const q = sp.get("q")?.trim() ?? "";
  const statusRaw = sp.get("status") ?? "all";
  const status: CustomerStatus | "all" =
    statusRaw && CUSTOMER_STATUSES.has(statusRaw as CustomerStatus | "all")
      ? (statusRaw as CustomerStatus | "all")
      : "all";

  const supabase = await createClient();
  const db = looseDb(supabase);

  let userIdFilter: string[] | null = null;
  const term = q.length > 0 ? sanitizeIlikeTerm(q) : "";
  if (term.length > 0) {
    const { data: profs } = await db
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
      .limit(500);
    const ids = (profs ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) {
      return {
        title: `Bestday customers ${todayTitlePart()}`,
        headers: CUSTOMER_HEADERS,
        rows: [],
      };
    }
    userIdFilter = ids;
  }

  let qry = db.from("customers").select("*").order("created_at", { ascending: false }).limit(MAX_OPS_EXPORT_ROWS);

  if (status !== "all") {
    qry = qry.eq("status", status);
  }
  if (userIdFilter) {
    qry = qry.in("user_id", userIdFilter);
  }

  const { data: customers, error } = await qry;
  if (error || !customers?.length) {
    return {
      title: `Bestday customers ${todayTitlePart()}`,
      headers: CUSTOMER_HEADERS,
      rows: [],
    };
  }

  const rows = customers as CustomerRow[];
  const userIds = [...new Set(rows.map((c) => c.user_id))];
  const { data: profiles } = await db.from("profiles").select("id, email, full_name").in("id", userIds);
  type ProfileMini = { id: string; email: string | null; full_name: string | null };
  const profileById = new Map<string, { email: string | null; full_name: string | null }>(
    (profiles ?? []).map((p: ProfileMini) => [p.id, { email: p.email, full_name: p.full_name }]),
  );

  const out: OperationalRow[] = rows.map((c) => {
    const p = profileById.get(c.user_id);
    return {
      id: c.id,
      user_id: c.user_id,
      status: c.status,
      phone: c.phone ?? "",
      region: c.region ?? "",
      profile_email: p?.email ?? "",
      profile_full_name: p?.full_name ?? "",
      metadata_json: truncateCell(jsonCell(c.metadata)),
      created_at: c.created_at,
      updated_at: c.updated_at,
    };
  });

  return {
    title: `Bestday customers ${todayTitlePart()}`,
    headers: CUSTOMER_HEADERS,
    rows: out,
  };
}

const CUSTOMER_HEADERS = [
  "id",
  "user_id",
  "status",
  "phone",
  "region",
  "profile_email",
  "profile_full_name",
  "metadata_json",
  "created_at",
  "updated_at",
] as const;

async function exportPrescreens(sp: URLSearchParams): Promise<OpsExportPayload> {
  const queue = sp.get("queue") === "review" ? "review" : null;
  const workflowRaw = sp.get("workflow") ?? "all";
  const workflow: PrescreenWorkflowStatus | "all" = WORKFLOWS.includes(
    workflowRaw as PrescreenWorkflowStatus | "all",
  )
    ? (workflowRaw as PrescreenWorkflowStatus | "all")
    : "all";
  const searchId = sp.get("id")?.trim() ?? "";

  const supabase = await createClient();
  const db = looseDb(supabase);

  let q = db
    .from("prescreens")
    .select(
      "id, created_at, workflow_status, user_id, lead_id, decision_summary_admin, version, decision_reason_codes, decision_log",
    )
    .order("created_at", { ascending: false })
    .limit(MAX_OPS_EXPORT_ROWS);

  if (queue === "review") {
    q = q.in("workflow_status", ["submitted", "needs_manual_review"]);
  } else if (workflow !== "all") {
    q = q.eq("workflow_status", workflow);
  }

  if (searchId.length > 0) {
    if (/^[0-9a-f-]{36}$/i.test(searchId)) {
      q = q.eq("id", searchId);
    } else {
      return {
        title: `Bestday prescreens ${todayTitlePart()}`,
        headers: PRESCREEN_HEADERS,
        rows: [],
      };
    }
  }

  const { data, error } = await q;
  if (error || !data) {
    return {
      title: `Bestday prescreens ${todayTitlePart()}`,
      headers: PRESCREEN_HEADERS,
      rows: [],
    };
  }

  const out: OperationalRow[] = (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    created_at: row.created_at as string,
    workflow_status: row.workflow_status as string,
    user_id: (row.user_id as string | null) ?? "",
    lead_id: (row.lead_id as string | null) ?? "",
    version: row.version as number,
    decision_reason_codes: Array.isArray(row.decision_reason_codes)
      ? (row.decision_reason_codes as string[]).join("|")
      : "",
    decision_summary_admin: truncateCell(String(row.decision_summary_admin ?? "")),
    decision_log_json: truncateCell(jsonCell(row.decision_log)),
  }));

  return {
    title: `Bestday prescreens ${todayTitlePart()}`,
    headers: PRESCREEN_HEADERS,
    rows: out,
  };
}

const PRESCREEN_HEADERS = [
  "id",
  "created_at",
  "workflow_status",
  "user_id",
  "lead_id",
  "version",
  "decision_reason_codes",
  "decision_summary_admin",
  "decision_log_json",
] as const;

async function exportAppointments(sp: URLSearchParams): Promise<OpsExportPayload> {
  const upcoming = sp.get("upcoming") === "1";
  const statusRaw = sp.get("status") ?? "all";
  const status: AppointmentStatus | "all" = APPT_STATUSES.includes(statusRaw as AppointmentStatus | "all")
    ? (statusRaw as AppointmentStatus | "all")
    : "all";
  const userSearch = sp.get("user")?.trim() ?? "";

  const supabase = await createClient();
  const db = looseDb(supabase);

  let q = db
    .from("appointments")
    .select(
      "id, start_time, end_time, timezone, status, user_id, customer_id, prescreen_id, calendly_event_uri, calendly_invitee_uri, source, created_at, updated_at",
    )
    .limit(MAX_OPS_EXPORT_ROWS);

  if (upcoming) {
    q = q.gte("start_time", new Date().toISOString()).order("start_time", { ascending: true });
  } else {
    q = q.order("start_time", { ascending: false });
  }
  if (status !== "all") {
    q = q.eq("status", status);
  }
  if (userSearch.length > 0 && /^[0-9a-f-]{36}$/i.test(userSearch)) {
    q = q.eq("user_id", userSearch);
  }

  const { data, error } = await q;
  if (error || !data) {
    return {
      title: `Bestday appointments ${todayTitlePart()}`,
      headers: APPOINTMENT_HEADERS,
      rows: [],
    };
  }

  const out: OperationalRow[] = (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    start_time: (row.start_time as string | null) ?? "",
    end_time: (row.end_time as string | null) ?? "",
    timezone: (row.timezone as string | null) ?? "",
    status: row.status as string,
    user_id: (row.user_id as string | null) ?? "",
    customer_id: (row.customer_id as string | null) ?? "",
    prescreen_id: (row.prescreen_id as string | null) ?? "",
    calendly_event_uri: (row.calendly_event_uri as string | null) ?? "",
    calendly_invitee_uri: (row.calendly_invitee_uri as string | null) ?? "",
    source: (row.source as string | null) ?? "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));

  return {
    title: `Bestday appointments ${todayTitlePart()}`,
    headers: APPOINTMENT_HEADERS,
    rows: out,
  };
}

const APPOINTMENT_HEADERS = [
  "id",
  "start_time",
  "end_time",
  "timezone",
  "status",
  "user_id",
  "customer_id",
  "prescreen_id",
  "calendly_event_uri",
  "calendly_invitee_uri",
  "source",
  "created_at",
  "updated_at",
] as const;

async function exportOrders(sp: URLSearchParams): Promise<OpsExportPayload> {
  const pendingOnly = sp.get("pending") === "1";
  const statusFilter = sp.get("status")?.trim() ?? "";
  const idFilter = sp.get("id")?.trim() ?? "";

  const supabase = await createClient();
  const db = looseDb(supabase);

  const { data, error } = await db
    .from("purchase_orders")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(MAX_OPS_EXPORT_ROWS);

  let orders = (error ? [] : (data ?? [])) as PurchaseOrderRow[];

  if (pendingOnly) {
    orders = orders.filter((o) => PENDING_ORDER_STATUSES.has(o.status));
  }
  if (statusFilter && statusFilter !== "all") {
    orders = orders.filter((o) => o.status === statusFilter);
  }
  if (/^[0-9a-f-]{36}$/i.test(idFilter)) {
    orders = orders.filter((o) => o.id === idFilter);
  }

  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const profileByCustomer = new Map<string, { email: string | null; full_name: string | null }>();

  if (customerIds.length > 0) {
    const { data: custRows } = await db.from("customers").select("id, user_id").in("id", customerIds);
    const cList = (custRows ?? []) as { id: string; user_id: string }[];
    const userIds = [...new Set(cList.map((c) => c.user_id))];
    const { data: profs } =
      userIds.length > 0
        ? await db.from("profiles").select("id, email, full_name").in("id", userIds)
        : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
    type ProfMini = { email: string | null; full_name: string | null };
    const profByUser = new Map<string, ProfMini>(
      (profs ?? []).map((p: { id: string; email: string | null; full_name: string | null }) => [
        p.id,
        { email: p.email, full_name: p.full_name },
      ]),
    );
    for (const c of cList) {
      const prof = profByUser.get(c.user_id);
      profileByCustomer.set(c.id, prof ?? { email: null, full_name: null });
    }
  }

  const out: OperationalRow[] = orders.map((o) => {
    const p = profileByCustomer.get(o.customer_id);
    return {
      id: o.id,
      customer_id: o.customer_id,
      patient_email: p?.email ?? "",
      patient_full_name: p?.full_name ?? "",
      delivery_recipient_name: o.delivery_recipient_name ?? "",
      status: o.status,
      currency: o.currency,
      subtotal_cents: o.subtotal_cents,
      total_cents: o.total_cents,
      placed_at: o.placed_at ?? "",
      delivery_line1: o.delivery_line1 ?? "",
      delivery_city: o.delivery_city ?? "",
      delivery_postal_code: o.delivery_postal_code ?? "",
      delivery_country: o.delivery_country,
      payment_provider: o.payment_provider,
      payment_metadata_json: truncateCell(jsonCell(o.payment_metadata)),
      created_at: o.created_at,
      updated_at: o.updated_at,
    };
  });

  return {
    title: `Bestday orders ${todayTitlePart()}`,
    headers: ORDER_HEADERS,
    rows: out,
  };
}

const ORDER_HEADERS = [
  "id",
  "customer_id",
  "patient_email",
  "patient_full_name",
  "delivery_recipient_name",
  "status",
  "currency",
  "subtotal_cents",
  "total_cents",
  "placed_at",
  "delivery_line1",
  "delivery_city",
  "delivery_postal_code",
  "delivery_country",
  "payment_provider",
  "payment_metadata_json",
  "created_at",
  "updated_at",
] as const;

function parseTicketParam(
  raw: string | null,
  allowed: Set<string>,
  fallback: "all",
): typeof fallback | string {
  if (!raw || raw === "all") return fallback;
  return allowed.has(raw) ? raw : fallback;
}

async function exportTickets(sp: URLSearchParams, staffUserId: string): Promise<OpsExportPayload> {
  const statusParam = parseTicketParam(sp.get("status"), TICKET_STATUSES as Set<string>, "all");
  const categoryParam = parseTicketParam(sp.get("category"), TICKET_CATEGORIES as Set<string>, "all");
  const assigneeRaw = sp.get("assignee");
  const assignee =
    assigneeRaw === "unassigned" || assigneeRaw === "me" ? assigneeRaw : ("all" as const);
  const viewOpen = sp.get("view") === "open";
  const openOnly = viewOpen && statusParam === "all";

  const supabase = await createClient();
  let q = looseDb(supabase)
    .from("tickets")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(MAX_OPS_EXPORT_ROWS);

  if (openOnly) {
    q = q.not("status", "in", "(resolved,closed)");
  }
  if (statusParam !== "all") {
    q = q.eq("status", statusParam);
  }
  if (categoryParam !== "all") {
    q = q.eq("category", categoryParam);
  }
  if (assignee === "unassigned") {
    q = q.is("assigned_to_user_id", null);
  }
  if (assignee === "me") {
    q = q.eq("assigned_to_user_id", staffUserId);
  }

  const { data, error } = await q;
  const tickets = (error ? [] : (data ?? [])) as TicketRow[];

  const out: OperationalRow[] = tickets.map((t) => ({
    id: t.id,
    prescreen_id: t.prescreen_id ?? "",
    lead_id: t.lead_id ?? "",
    customer_id: t.customer_id ?? "",
    created_by_user_id: t.created_by_user_id ?? "",
    subject: truncateCell(t.subject),
    status: t.status,
    priority: t.priority,
    category: t.category,
    assigned_to_user_id: t.assigned_to_user_id ?? "",
    purchase_order_id: t.purchase_order_id ?? "",
    metadata_json: truncateCell(jsonCell(t.metadata)),
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  return {
    title: `Bestday tickets ${todayTitlePart()}`,
    headers: TICKET_HEADERS,
    rows: out,
  };
}

const TICKET_HEADERS = [
  "id",
  "prescreen_id",
  "lead_id",
  "customer_id",
  "created_by_user_id",
  "subject",
  "status",
  "priority",
  "category",
  "assigned_to_user_id",
  "purchase_order_id",
  "metadata_json",
  "created_at",
  "updated_at",
] as const;
