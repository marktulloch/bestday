import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient<Database>;

export async function cancelPendingNotificationsForAppointment(
  admin: Admin,
  appointmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await admin
    .from("notifications")
    .update({ status: "cancelled", updated_at: now })
    .eq("appointment_id", appointmentId)
    .in("status", ["pending", "queued"]);
}
