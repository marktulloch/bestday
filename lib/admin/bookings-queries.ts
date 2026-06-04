import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { AppointmentRow, AppointmentStatus } from "@/lib/database.types";

export type AppointmentAdminListRow = Pick<
  AppointmentRow,
  | "id"
  | "start_time"
  | "end_time"
  | "timezone"
  | "status"
  | "user_id"
  | "customer_id"
  | "calendly_event_uri"
  | "created_at"
>;

export async function listAppointmentsForAdmin(input: {
  upcoming?: boolean;
  status?: AppointmentStatus | "all";
  searchUserId?: string | null;
  limit?: number;
}): Promise<AppointmentAdminListRow[]> {
  const limit = Math.min(input.limit ?? 100, 200);
  const supabase = await createClient();
  const db = looseDb(supabase);

  let q = db
    .from("appointments")
    .select(
      "id, start_time, end_time, timezone, status, user_id, customer_id, calendly_event_uri, created_at",
    )
    .limit(limit);

  if (input.upcoming) {
    q = q
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });
  } else {
    q = q.order("start_time", { ascending: false });
  }
  if (input.status && input.status !== "all") {
    q = q.eq("status", input.status);
  }
  const uid = input.searchUserId?.trim() ?? "";
  if (uid.length > 0 && /^[0-9a-f-]{36}$/i.test(uid)) {
    q = q.eq("user_id", uid);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return data as AppointmentAdminListRow[];
}

export async function getAppointmentForAdmin(id: string): Promise<AppointmentRow | null> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const { data } = await db.from("appointments").select("*").eq("id", id).maybeSingle();
  return (data as AppointmentRow | null) ?? null;
}
