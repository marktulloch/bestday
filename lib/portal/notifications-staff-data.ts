import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/database.types";

export type NotificationStaffRow = Pick<
  NotificationRow,
  | "id"
  | "created_at"
  | "scheduled_for"
  | "sent_at"
  | "to_address"
  | "template_key"
  | "channel"
  | "status"
  | "provider"
  | "provider_message_id"
  | "error_message"
  | "appointment_id"
>;

export async function getRecentNotificationsForStaff(
  limit = 100,
): Promise<NotificationStaffRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, created_at, scheduled_for, sent_at, to_address, template_key, channel, status, provider, provider_message_id, error_message, appointment_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as NotificationStaffRow[];
}
