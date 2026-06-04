import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmailMailerFromEnv } from "./mailer";

type Admin = SupabaseClient<Database>;

type NotificationSendRow = {
  id: string;
  to_address: string;
  subject: string;
  body_html: string;
  body_text: string;
  channel: string;
};

/**
 * Picks due rows, sends email (or marks skipped/failed), updates audit fields.
 */
export async function processDueNotifications(
  admin: Admin,
  opts: { limit: number },
): Promise<{ processed: number; errors: number }> {
  const mailer = createEmailMailerFromEnv();
  const nowIso = new Date().toISOString();

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < opts.limit; i++) {
    const { data: row } = await admin
      .from("notifications")
      .select("id, to_address, subject, body_html, body_text, channel")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!row) break;

    const n = row as NotificationSendRow;

    const { data: lock } = await admin
      .from("notifications")
      .update({ status: "sending", updated_at: nowIso })
      .eq("id", n.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (!lock) continue;

    if (n.channel === "sms") {
      await admin
        .from("notifications")
        .update({
          status: "skipped",
          error_message: "SMS channel not enabled yet",
          provider: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", n.id);
      processed += 1;
      continue;
    }

    const result = await mailer.send({
      to: n.to_address,
      subject: n.subject,
      html: n.body_html,
      text: n.body_text,
    });

    const ts = new Date().toISOString();

    if (result.ok) {
      await admin
        .from("notifications")
        .update({
          status: "sent",
          provider: result.provider,
          provider_message_id: result.messageId,
          error_message: null,
          sent_at: ts,
          updated_at: ts,
        })
        .eq("id", n.id);
    } else {
      errors += 1;
      await admin
        .from("notifications")
        .update({
          status: "failed",
          provider: result.provider,
          error_message: result.error,
          updated_at: ts,
        })
        .eq("id", n.id);
    }

    processed += 1;
  }

  return { processed, errors };
}
