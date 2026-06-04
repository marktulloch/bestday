import type { Json } from "@/lib/database.types";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { wrapBestDayEmail } from "./email-layout";
import { renderTemplateString } from "./render-template";
import type { NotificationTemplateKey } from "./template-keys";

type Admin = SupabaseClient<Database>;

export type LoadedEmailTemplate = {
  id: string;
  template_key: string;
  subject_template: string | null;
  body_html_template: string;
  body_text_template: string;
};

export async function loadEmailTemplate(
  admin: Admin,
  templateKey: NotificationTemplateKey,
): Promise<LoadedEmailTemplate | null> {
  const { data, error } = await admin
    .from("notification_templates")
    .select("id, template_key, subject_template, body_html_template, body_text_template")
    .eq("template_key", templateKey)
    .eq("channel", "email")
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as LoadedEmailTemplate;
}

export async function notificationAlreadyScheduled(
  admin: Admin,
  appointmentId: string,
  templateKey: string,
): Promise<boolean> {
  const { data } = await admin
    .from("notifications")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("template_key", templateKey)
    .in("status", ["pending", "queued", "sending", "sent"])
    .maybeSingle();

  return !!data;
}

export async function insertRenderedNotification(args: {
  admin: Admin;
  appointmentId: string | null;
  customerId: string | null;
  userId: string | null;
  templateKey: string;
  templateId: string | null;
  channel: "email" | "sms";
  toAddress: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  scheduledFor: Date;
  metadata?: Json;
}): Promise<string | null> {
  const now = new Date().toISOString();
  const { data, error } = await args.admin
    .from("notifications")
    .insert({
      appointment_id: args.appointmentId,
      customer_id: args.customerId,
      user_id: args.userId,
      template_key: args.templateKey,
      template_id: args.templateId,
      channel: args.channel,
      to_address: args.toAddress,
      subject: args.subject,
      body_html: args.bodyHtml,
      body_text: args.bodyText,
      status: "pending",
      scheduled_for: args.scheduledFor.toISOString(),
      metadata: args.metadata ?? {},
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data?.id) return null;
  return data.id;
}

export async function scheduleEmailFromTemplate(args: {
  admin: Admin;
  templateKey: NotificationTemplateKey;
  appointmentId: string | null;
  customerId: string | null;
  userId: string | null;
  toEmail: string;
  context: Record<string, string>;
  scheduledFor: Date;
}): Promise<string | null> {
  const tpl = await loadEmailTemplate(args.admin, args.templateKey);
  if (!tpl) return null;

  const subjectRaw = tpl.subject_template ?? args.templateKey;
  const subject = renderTemplateString(subjectRaw, args.context);
  const innerHtml = renderTemplateString(tpl.body_html_template, args.context);
  const bodyText = renderTemplateString(tpl.body_text_template, args.context);
  const bodyHtml = wrapBestDayEmail(innerHtml);

  return insertRenderedNotification({
    admin: args.admin,
    appointmentId: args.appointmentId,
    customerId: args.customerId,
    userId: args.userId,
    templateKey: args.templateKey,
    templateId: tpl.id,
    channel: "email",
    toAddress: args.toEmail,
    subject,
    bodyHtml,
    bodyText,
    scheduledFor: args.scheduledFor,
    metadata: { template_key: args.templateKey },
  });
}
