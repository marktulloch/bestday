import "server-only";

import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentRow,
  ConsultationNoteRow,
  ConsultationRecommendationRow,
  CustomerDocumentRow,
  CustomerOrderRow,
  CustomerProductApprovalRow,
  CustomerRow,
  NotificationRow,
  PrescreenRow,
  PrescreeningResponseRow,
  ProductRow,
  ProfileRow,
  PurchaseOrderFulfilmentRow,
  PurchaseOrderRow,
  TicketRow,
} from "@/lib/database.types";
import { formatMcPrescreeningResponseLines } from "@/lib/mc-flow/mc-prescreening-format";
import { formatPrescreenPayloadSummary } from "@/lib/doctor/prescreen-summary";
import { formatDecisionLogForAdmin, parseDecisionLogFromDb } from "@/lib/prescreen/eligibility/admin-format";
import { getCustomerPrescreenSummary } from "@/lib/prescreen/eligibility/customer-summary";
import { sortTimelineEvents } from "./timeline";
import type {
  CustomerProfile360ViewModel,
  McQuestionnaireProfileEntry,
  NotificationProfileEntry,
  PrescreenProfileEntry,
  ProductApprovalProfileEntry,
  ProfileLinkContext,
  ProfileTimelineEvent,
  PurchaseOrderProfileEntry,
} from "./types";
import type { Profile360Visibility } from "./visibility";
import { profileLinkContext, profileVisibilityForRole } from "./visibility";

function isoSortKey(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z").padEnd(30, "0");
}

function ticketHref(ctx: ProfileLinkContext, id: string): string {
  if (ctx === "portal") return `/portal/tickets/${id}`;
  if (ctx === "doctor") return `/doctor/tickets/${id}`;
  return `/admin/tickets/${id}`;
}

function orderHref(ctx: ProfileLinkContext, id: string): string {
  if (ctx === "portal") return `/portal/orders/${id}`;
  return `/admin/orders/${id}`;
}

function bookingHref(ctx: ProfileLinkContext, id: string): string {
  if (ctx === "admin") return `/admin/bookings/${id}`;
  return `/portal/booking`;
}

function prescreenHref(ctx: ProfileLinkContext, id: string): string {
  if (ctx === "admin") return `/admin/prescreens/${id}`;
  return `/prescreen`;
}

function buildPrescreenEntries(
  rows: PrescreenRow[],
  visibility: Profile360Visibility,
): PrescreenProfileEntry[] {
  return rows.map((ps) => {
    const patient = getCustomerPrescreenSummary(ps.workflow_status);
    const base: PrescreenProfileEntry = {
      id: ps.id,
      workflow_status: ps.workflow_status,
      created_at: ps.created_at,
      patientLabel: patient.label,
      patientDetail: patient.detail,
    };
    if (!visibility.showInternalPrescreen) return base;
    return {
      ...base,
      payloadSummaryLines: formatPrescreenPayloadSummary(ps.payload),
      decisionSummaryAdmin: ps.decision_summary_admin,
      reasonCodes: ps.decision_reason_codes ?? [],
      decisionLogLines: formatDecisionLogForAdmin(parseDecisionLogFromDb(ps.decision_log)),
    };
  });
}

function notificationEntries(
  rows: NotificationRow[],
  showBodies: boolean,
): NotificationProfileEntry[] {
  return rows.map((n) => ({
    id: n.id,
    template_key: n.template_key,
    subject: n.subject,
    status: n.status,
    channel: n.channel,
    sent_at: n.sent_at,
    scheduled_for: n.scheduled_for,
    bodyPreview: showBodies
      ? (n.body_text ?? n.body_html).replace(/\s+/g, " ").trim().slice(0, 160) || undefined
      : undefined,
  }));
}

function buildTimeline(input: {
  ctx: ProfileLinkContext;
  prescreens: PrescreenProfileEntry[];
  mcQuestionnaires: McQuestionnaireProfileEntry[];
  appointments: CustomerProfile360ViewModel["appointments"];
  customerOrders: CustomerProfile360ViewModel["customerOrders"];
  purchaseOrders: PurchaseOrderProfileEntry[];
  tickets: CustomerProfile360ViewModel["tickets"];
  consultationNotes: CustomerProfile360ViewModel["consultationNotes"];
  notifications: NotificationProfileEntry[];
  documents: CustomerProfile360ViewModel["documents"];
  recommendations: CustomerProfile360ViewModel["recommendations"];
}): ProfileTimelineEvent[] {
  const events: ProfileTimelineEvent[] = [];
  const { ctx } = input;

  for (const p of input.prescreens) {
    events.push({
      sortKey: isoSortKey(p.created_at),
      icon: "prescreen",
      title: `Pre-screen · ${p.patientLabel}`,
      subtitle: p.workflow_status.replace(/_/g, " "),
      href: prescreenHref(ctx, p.id),
    });
  }

  for (const m of input.mcQuestionnaires) {
    events.push({
      sortKey: isoSortKey(m.created_at),
      icon: "prescreen",
      title: `Questionnaire · ${m.eligible ? "Eligible" : "Not eligible"}`,
      subtitle: m.ineligible_reason ?? undefined,
    });
  }

  for (const a of input.appointments) {
    events.push({
      sortKey: isoSortKey(a.start_time ?? ""),
      icon: "booking",
      title: "Appointment",
      subtitle: `${a.status.replace(/_/g, " ")} · ${a.start_time ? new Date(a.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"}`,
      href: bookingHref(ctx, a.id),
    });
  }

  for (const o of input.customerOrders) {
    events.push({
      sortKey: isoSortKey(o.created_at),
      icon: "product_line",
      title: `Product line · ${o.product_name}`,
      subtitle: o.status.replace(/_/g, " "),
    });
  }

  for (const po of input.purchaseOrders) {
    const t = po.placed_at ?? po.created_at;
    events.push({
      sortKey: isoSortKey(t),
      icon: "order",
      title: `Order · ${po.status.replace(/_/g, " ")}`,
      subtitle: `${(po.total_cents / 100).toFixed(2)} ${po.currency}`,
      href: orderHref(ctx, po.id),
    });
    if (po.delivery_status && po.delivery_status !== "pending") {
      events.push({
        sortKey: isoSortKey(t) + "_f",
        icon: "delivery",
        title: "Delivery update",
        subtitle: `${po.delivery_status.replace(/_/g, " ")}${po.tracking_number ? ` · ${po.tracking_number}` : ""}`,
        href: orderHref(ctx, po.id),
      });
    }
  }

  for (const t of input.tickets) {
    events.push({
      sortKey: isoSortKey(t.created_at),
      icon: "ticket",
      title: t.subject,
      subtitle: t.status.replace(/_/g, " "),
      href: ticketHref(ctx, t.id),
    });
  }

  for (const n of input.consultationNotes) {
    events.push({
      sortKey: isoSortKey(n.created_at),
      icon: "note",
      title: "Consultation note",
      subtitle: n.body.replace(/\s+/g, " ").slice(0, 80) + (n.body.length > 80 ? "…" : ""),
    });
  }

  for (const r of input.recommendations) {
    events.push({
      sortKey: isoSortKey(r.created_at),
      icon: "recommendation",
      title: `Recommendation · ${r.title}`,
      subtitle: r.outcome.replace(/_/g, " "),
    });
  }

  for (const n of input.notifications) {
    const at = n.sent_at ?? n.scheduled_for;
    events.push({
      sortKey: isoSortKey(at),
      icon: "notification",
      title: `Notification · ${n.template_key.replace(/_/g, " ")}`,
      subtitle: n.subject.slice(0, 100),
    });
  }

  for (const d of input.documents) {
    events.push({
      sortKey: isoSortKey(d.created_at),
      icon: "document",
      title: `Document · ${d.title}`,
      subtitle: d.kind,
    });
  }

  return sortTimelineEvents(events).slice(0, 60);
}

export async function loadCustomerProfile360(input: {
  customerId: string;
  viewerUserId: string;
  role: AppRole;
}): Promise<CustomerProfile360ViewModel | null> {
  const { customerId, viewerUserId, role } = input;
  if (role !== "customer" && role !== "doctor" && role !== "admin" && role !== "master") {
    return null;
  }

  const supabase = await createClient();
  const { data: customerRow, error: cErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (cErr || !customerRow) return null;
  const customer = customerRow as CustomerRow;

  if (role === "customer" && customer.user_id !== viewerUserId) {
    return null;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", customer.user_id)
    .maybeSingle();

  const profile = (profileRow ?? null) as Pick<ProfileRow, "email" | "full_name"> | null;

  const visibility = profileVisibilityForRole(role);
  const linkCtx = profileLinkContext(role);

  const notesPromise = visibility.showConsultationNotes
    ? supabase
        .from("consultation_notes")
        .select("id, body, created_at, appointment_id")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(40)
    : Promise.resolve({ data: [] as ConsultationNoteRow[] });

  const recPromise = visibility.showRecommendations
    ? supabase
        .from("consultation_recommendations")
        .select("id, title, detail, outcome, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(30)
    : Promise.resolve({ data: [] as ConsultationRecommendationRow[] });

  const [
    prescreensRes,
    mcResponsesRes,
    appointmentsRes,
    notesRes,
    recRes,
    custOrdersRes,
    approvalsRes,
    poRes,
    ticketsRes,
    notificationsRes,
    documentsRes,
  ] = await Promise.all([
    supabase
      .from("prescreens")
      .select("*")
      .eq("user_id", customer.user_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("prescreening_responses")
      .select("*")
      .eq("user_id", customer.user_id)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("appointments")
      .select("id, status, start_time, end_time, timezone")
      .or(`customer_id.eq.${customerId},user_id.eq.${customer.user_id}`)
      .order("start_time", { ascending: false })
      .limit(30),
    notesPromise,
    recPromise,
    supabase
      .from("customer_orders")
      .select("id, product_name, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("customer_product_approvals")
      .select("id, product_id, status, approved_at, notes")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("purchase_orders")
      .select("id, status, total_cents, currency, placed_at, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("tickets")
      .select("id, subject, status, priority, category, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("notifications")
      .select("*")
      .or(`customer_id.eq.${customerId},user_id.eq.${customer.user_id}`)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("customer_documents")
      .select("id, title, kind, external_url, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const prescreens = (prescreensRes.data ?? []) as PrescreenRow[];
  const prescreenEntries = buildPrescreenEntries(prescreens, visibility);

  const mcRows = (mcResponsesRes.data ?? []) as PrescreeningResponseRow[];
  const mcQuestionnaires: McQuestionnaireProfileEntry[] = mcRows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    eligible: row.eligible,
    ineligible_reason: row.ineligible_reason,
    summaryLines: formatMcPrescreeningResponseLines(row),
  }));

  const appointments = (appointmentsRes.data ?? []) as AppointmentRow[];
  const appointmentVm = appointments.map((a) => ({
    id: a.id,
    status: a.status,
    start_time: a.start_time,
    end_time: a.end_time,
    timezone: a.timezone,
  }));

  const consultationNotes = (notesRes.data ?? []) as ConsultationNoteRow[];
  const notesVm = consultationNotes.map((n) => ({
    id: n.id,
    body: n.body,
    created_at: n.created_at,
    appointment_id: n.appointment_id,
  }));

  const recommendations = (recRes.data ?? []) as ConsultationRecommendationRow[];
  const recVm = recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    outcome: r.outcome,
    created_at: r.created_at,
  }));

  const customerOrders = (custOrdersRes.data ?? []) as CustomerOrderRow[];
  const coVm = customerOrders.map((o) => ({
    id: o.id,
    product_name: o.product_name,
    status: o.status,
    created_at: o.created_at,
  }));

  const approvals = (approvalsRes.data ?? []) as CustomerProductApprovalRow[];
  const productIds = [...new Set(approvals.map((a) => a.product_id))];
  let productById = new Map<string, Pick<ProductRow, "name" | "slug">>();
  if (productIds.length > 0) {
    const { data: products } = await supabase.from("products").select("id, name, slug").in("id", productIds);
    productById = new Map(
      ((products ?? []) as Pick<ProductRow, "id" | "name" | "slug">[]).map((p) => [
        p.id,
        { name: p.name, slug: p.slug },
      ]),
    );
  }

  const productApprovals: ProductApprovalProfileEntry[] = approvals.map((a) => {
    const p = productById.get(a.product_id);
    return {
      id: a.id,
      product_id: a.product_id,
      product_name: p?.name ?? "Product",
      product_slug: p?.slug ?? null,
      status: a.status,
      approved_at: a.approved_at,
    };
  });

  const purchaseOrders = (poRes.data ?? []) as PurchaseOrderRow[];
  const orderIds = purchaseOrders.map((o) => o.id);
  let lineCountByOrder = new Map<string, number>();
  let fulfilByOrder = new Map<string, PurchaseOrderFulfilmentRow>();
  if (orderIds.length > 0) {
    const [{ data: lines }, { data: fulfils }] = await Promise.all([
      supabase.from("purchase_order_items").select("purchase_order_id").in("purchase_order_id", orderIds),
      supabase.from("purchase_order_fulfilment").select("*").in("purchase_order_id", orderIds),
    ]);
    for (const row of (lines ?? []) as { purchase_order_id: string }[]) {
      lineCountByOrder.set(row.purchase_order_id, (lineCountByOrder.get(row.purchase_order_id) ?? 0) + 1);
    }
    for (const f of (fulfils ?? []) as PurchaseOrderFulfilmentRow[]) {
      fulfilByOrder.set(f.purchase_order_id, f);
    }
  }

  const purchaseVm: PurchaseOrderProfileEntry[] = purchaseOrders.map((po) => {
    const f = fulfilByOrder.get(po.id);
    return {
      id: po.id,
      status: po.status,
      total_cents: po.total_cents,
      currency: po.currency,
      placed_at: po.placed_at,
      created_at: po.created_at,
      lineCount: lineCountByOrder.get(po.id) ?? 0,
      delivery_status: f?.delivery_status ?? null,
      tracking_number: f?.tracking_number ?? null,
      courier: f?.courier ?? null,
    };
  });

  const tickets = (ticketsRes.data ?? []) as TicketRow[];
  const ticketsVm = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    category: t.category,
    created_at: t.created_at,
  }));

  const notificationsRaw = (notificationsRes.data ?? []) as NotificationRow[];
  const notifications = notificationEntries(notificationsRaw, visibility.showNotificationBodies);

  const documentsRaw = (documentsRes.data ?? []) as Pick<
    CustomerDocumentRow,
    "id" | "title" | "kind" | "external_url" | "created_at"
  >[];
  const documentsVm = documentsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    external_url: d.external_url,
    created_at: d.created_at,
  }));

  const vmBase: Omit<CustomerProfile360ViewModel, "timeline"> = {
    customerId: customer.id,
    userId: customer.user_id,
    visibility,
    linkContext: linkCtx,
    profile: { email: profile?.email ?? null, full_name: profile?.full_name ?? null },
    customer: {
      status: customer.status,
      phone: customer.phone,
      region: customer.region,
      created_at: customer.created_at,
    },
    prescreens: prescreenEntries,
    mcQuestionnaires,
    appointments: appointmentVm,
    consultationNotes: notesVm,
    recommendations: recVm,
    customerOrders: coVm,
    productApprovals,
    purchaseOrders: purchaseVm,
    tickets: ticketsVm,
    notifications,
    documents: documentsVm,
  };

  const timeline = buildTimeline({
    ctx: linkCtx,
    prescreens: prescreenEntries,
    mcQuestionnaires,
    appointments: appointmentVm,
    customerOrders: coVm,
    purchaseOrders: purchaseVm,
    tickets: ticketsVm,
    consultationNotes: notesVm,
    notifications,
    documents: documentsVm,
    recommendations: recVm,
  });

  return { ...vmBase, timeline };
}

export async function loadCustomerProfile360ForCurrentUser(input: {
  viewerUserId: string;
  role: AppRole;
}): Promise<CustomerProfile360ViewModel | null> {
  if (input.role !== "customer") return null;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", input.viewerUserId)
    .maybeSingle();
  if (!row) return null;
  return loadCustomerProfile360({
    customerId: (row as { id: string }).id,
    viewerUserId: input.viewerUserId,
    role: "customer",
  });
}
