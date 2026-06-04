import type { AppointmentRow } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { cancelPendingNotificationsForAppointment } from "@/lib/notifications/cancel-pending";
import {
  scheduleBookingNotifications,
  scheduleNoShowFollowUp,
  scheduleRebookingPrompt,
} from "@/lib/notifications/schedule-appointment-reminders";

export type BookingAdminClient = SupabaseClient<Database>;

export async function onAppointmentBooked(
  admin: BookingAdminClient,
  appointment: AppointmentRow,
): Promise<void> {
  await scheduleBookingNotifications(admin, appointment);
}

export async function onAppointmentCancelled(
  admin: BookingAdminClient,
  appointment: AppointmentRow,
): Promise<void> {
  await cancelPendingNotificationsForAppointment(admin, appointment.id);
}

export async function onAppointmentRescheduled(
  admin: BookingAdminClient,
  previous: AppointmentRow | null,
  next: AppointmentRow,
): Promise<void> {
  if (previous?.id) {
    await cancelPendingNotificationsForAppointment(admin, previous.id);
  }
  await scheduleBookingNotifications(admin, next);
}

export async function onAppointmentCompleted(
  admin: BookingAdminClient,
  appointment: AppointmentRow,
): Promise<void> {
  await cancelPendingNotificationsForAppointment(admin, appointment.id);
  await scheduleRebookingPrompt(admin, appointment);
}

export async function onAppointmentNoShow(
  admin: BookingAdminClient,
  appointment: AppointmentRow,
): Promise<void> {
  await cancelPendingNotificationsForAppointment(admin, appointment.id);
  await scheduleNoShowFollowUp(admin, appointment);
}
