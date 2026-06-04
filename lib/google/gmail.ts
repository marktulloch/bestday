import "server-only";

import { google } from "googleapis";

import { getWorkspaceJwtClient } from "./auth";
import { getDelegatedWorkspaceUser, getGmailFromAddress, GOOGLE_SCOPES } from "./config";

export type GmailSendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type GmailSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function buildRfc822Message(from: string, to: string, subject: string, text: string, html: string): string {
  const boundary = `bd_${Math.random().toString(36).slice(2, 11)}`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ];
  return headers.join("\r\n");
}

function toGmailRaw(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send mail via Gmail API as the delegated Workspace user.
 * Requires domain-wide delegation for `gmail.send` and `GOOGLE_WORKSPACE_DELEGATED_USER`.
 */
export async function sendGmailMessage(input: GmailSendInput): Promise<GmailSendResult> {
  const delegated = getDelegatedWorkspaceUser();
  if (!delegated) {
    return { ok: false, error: "Missing GOOGLE_WORKSPACE_DELEGATED_USER for Gmail send." };
  }

  const from = getGmailFromAddress() ?? delegated;
  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.gmailSend]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildRfc822Message(from, input.to, input.subject, input.text, input.html);

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: toGmailRaw(raw) },
    });
    const id = res.data.id;
    if (!id) {
      return { ok: false, error: "Gmail API returned no message id." };
    }
    return { ok: true, messageId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
