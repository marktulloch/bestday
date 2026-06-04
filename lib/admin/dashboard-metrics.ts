import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

export type AdminDashboardMetrics = {
  newPrescreens: number;
  eligibleForBooking: number;
  upcomingAppointments: number;
  pendingOrders: number;
  openTickets: number;
};

/**
 * Summary counts for the admin home (RLS: master/admin).
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const nowIso = new Date().toISOString();

  const [
    newPrescreensRes,
    eligibleRes,
    upcomingRes,
    pendingOrdersRes,
    openTicketsRes,
  ] = await Promise.all([
    db
      .from("prescreens")
      .select("id", { count: "exact", head: true })
      .in("workflow_status", ["submitted", "needs_manual_review"]),
    db
      .from("prescreens")
      .select("id", { count: "exact", head: true })
      .eq("workflow_status", "eligible_for_booking"),
    db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("start_time", nowIso)
      .eq("status", "scheduled"),
    db
      .from("purchase_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["awaiting_payment", "paid", "awaiting_fulfilment", "packed", "dispatched"]),
    db
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(resolved,closed)"),
  ]);

  return {
    newPrescreens: newPrescreensRes.count ?? 0,
    eligibleForBooking: eligibleRes.count ?? 0,
    upcomingAppointments: upcomingRes.count ?? 0,
    pendingOrders: pendingOrdersRes.count ?? 0,
    openTickets: openTicketsRes.count ?? 0,
  };
}
