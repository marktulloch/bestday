import { createClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/lib/database.types";

export type UpcomingAppointmentSnapshot = Pick<
  AppointmentRow,
  | "id"
  | "start_time"
  | "end_time"
  | "timezone"
  | "status"
  | "calendly_event_type_name"
  | "location_join_url"
  | "calendly_event_uri"
>;

/**
 * Next future scheduled consultation for the portal user (Supabase is source of truth).
 */
export async function getUpcomingAppointmentForUser(
  userId: string,
): Promise<UpcomingAppointmentSnapshot | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, timezone, status, calendly_event_type_name, location_join_url, calendly_event_uri",
    )
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .not("start_time", "is", null)
    .gte("start_time", nowIso)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as UpcomingAppointmentSnapshot;
}
