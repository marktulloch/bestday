import { createClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/lib/database.types";

export type AppointmentStaffRow = Pick<
  AppointmentRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "start_time"
  | "end_time"
  | "timezone"
  | "status"
  | "user_id"
  | "customer_id"
  | "calendly_event_uri"
  | "calendly_invitee_uri"
  | "google_calendar_event_id"
>;

export async function getRecentAppointmentsForStaff(
  limit = 40,
): Promise<AppointmentStaffRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, created_at, updated_at, start_time, end_time, timezone, status, user_id, customer_id, calendly_event_uri, calendly_invitee_uri, google_calendar_event_id",
    )
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AppointmentStaffRow[];
}
