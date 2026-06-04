import type { AppointmentRow } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAppointmentTemplateContext } from "./appointment-context";
import { processDueNotifications } from "./process-due-notifications";
import { notificationAlreadyScheduled, scheduleEmailFromTemplate } from "./schedule-notification";

type Admin = SupabaseClient<Database>;

async function resolveRecipient(
  admin: Admin,
  appointment: AppointmentRow,
): Promise<{ email: string; full_name: string | null } | null> {
  if (!appointment.user_id) return null;
  const { data } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", appointment.user_id)
    .maybeSingle();
  if (!data?.email) return null;
  return { email: data.email, full_name: data.full_name };
}

/**
 * Queues confirmation + 24h + 2h reminders (email). Idempotent per appointment + template_key.
 */
export async function scheduleBookingNotifications(
  admin: Admin,
  appointment: AppointmentRow,
): Promise<void> {
  const recipient = await resolveRecipient(admin, appointment);
  if (!recipient) return;

  const ctx = buildAppointmentTemplateContext(appointment, {
    full_name: recipient.full_name,
  });
  if (!appointment.start_time) return;
  const startMs = new Date(appointment.start_time).getTime();
  const now = Date.now();

  if (!(await notificationAlreadyScheduled(admin, appointment.id, "booking_confirmation"))) {
    await scheduleEmailFromTemplate({
      admin,
      templateKey: "booking_confirmation",
      appointmentId: appointment.id,
      customerId: appointment.customer_id,
      userId: appointment.user_id,
      toEmail: recipient.email,
      context: ctx,
      scheduledFor: new Date(),
    });
  }

  const t24 = startMs - 24 * 60 * 60 * 1000;
  if (t24 > now && !(await notificationAlreadyScheduled(admin, appointment.id, "reminder_24h"))) {
    await scheduleEmailFromTemplate({
      admin,
      templateKey: "reminder_24h",
      appointmentId: appointment.id,
      customerId: appointment.customer_id,
      userId: appointment.user_id,
      toEmail: recipient.email,
      context: ctx,
      scheduledFor: new Date(t24),
    });
  }

  const t2 = startMs - 2 * 60 * 60 * 1000;
  if (t2 > now && !(await notificationAlreadyScheduled(admin, appointment.id, "reminder_2h"))) {
    await scheduleEmailFromTemplate({
      admin,
      templateKey: "reminder_2h",
      appointmentId: appointment.id,
      customerId: appointment.customer_id,
      userId: appointment.user_id,
      toEmail: recipient.email,
      context: ctx,
      scheduledFor: new Date(t2),
    });
  }

  await processDueNotifications(admin, { limit: 20 });
}

export async function scheduleNoShowFollowUp(
  admin: Admin,
  appointment: AppointmentRow,
): Promise<void> {
  const recipient = await resolveRecipient(admin, appointment);
  if (!recipient) return;

  if (await notificationAlreadyScheduled(admin, appointment.id, "no_show_followup")) return;

  const ctx = buildAppointmentTemplateContext(appointment, {
    full_name: recipient.full_name,
  });
  const when = new Date(Date.now() + 30 * 60 * 1000);

  await scheduleEmailFromTemplate({
    admin,
    templateKey: "no_show_followup",
    appointmentId: appointment.id,
    customerId: appointment.customer_id,
    userId: appointment.user_id,
    toEmail: recipient.email,
    context: ctx,
    scheduledFor: when,
  });

  await processDueNotifications(admin, { limit: 10 });
}

export async function scheduleRebookingPrompt(
  admin: Admin,
  appointment: AppointmentRow,
): Promise<void> {
  const recipient = await resolveRecipient(admin, appointment);
  if (!recipient) return;

  if (await notificationAlreadyScheduled(admin, appointment.id, "rebooking_prompt")) return;

  const ctx = buildAppointmentTemplateContext(appointment, {
    full_name: recipient.full_name,
  });
  const when = new Date(Date.now() + 4 * 60 * 60 * 1000);

  await scheduleEmailFromTemplate({
    admin,
    templateKey: "rebooking_prompt",
    appointmentId: appointment.id,
    customerId: appointment.customer_id,
    userId: appointment.user_id,
    toEmail: recipient.email,
    context: ctx,
    scheduledFor: when,
  });

  await processDueNotifications(admin, { limit: 10 });
}
