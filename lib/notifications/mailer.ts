/**
 * Transactional email abstraction. Add SMS / push behind a shared `Notifier` later.
 *
 * Providers (env-driven):
 * - RESEND_API_KEY + RESEND_FROM_EMAIL → Resend HTTP API
 * - Else → log-only (marks sent in dev; set NOTIFICATIONS_FORCE_LOG_ONLY=true to never send)
 *
 * Gmail API: implement `EmailMailer` with googleapis when you have OAuth/service account;
 * keep the interface stable.
 */

export type SendEmailResult =
  | { ok: true; messageId: string; provider: string }
  | { ok: false; error: string; provider: string };

export interface EmailMailer {
  readonly providerId: string;
  send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendEmailResult>;
}

export class LogOnlyEmailMailer implements EmailMailer {
  readonly providerId = "log_only";

  async send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendEmailResult> {
    console.info(
      `[notifications:log_only] to=${opts.to} subject=${JSON.stringify(opts.subject)} textLen=${opts.text.length}`,
    );
    return {
      ok: true,
      messageId: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      provider: this.providerId,
    };
  }
}

export class ResendEmailMailer implements EmailMailer {
  readonly providerId = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
  ) {}

  async send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendEmailResult> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: json.message ?? `resend_http_${res.status}`,
        provider: this.providerId,
      };
    }

    return {
      ok: true,
      messageId: json.id ?? `resend-${Date.now()}`,
      provider: this.providerId,
    };
  }
}

/**
 * Gmail API via Workspace service account + domain-wide delegation.
 * Lazy-loads `lib/google` so deployments without Google credentials do not pull googleapis at module init.
 */
export class GmailApiMailer implements EmailMailer {
  readonly providerId = "gmail_api";

  async send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<SendEmailResult> {
    const { sendGmailMessage } = await import("@/lib/google/gmail");
    const r = await sendGmailMessage({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (!r.ok) {
      return { ok: false, error: r.error, provider: this.providerId };
    }
    return { ok: true, messageId: r.messageId, provider: this.providerId };
  }
}

export function createEmailMailerFromEnv(): EmailMailer {
  if (process.env.NOTIFICATIONS_FORCE_LOG_ONLY === "true") {
    return new LogOnlyEmailMailer();
  }

  const useGmail = process.env.GMAIL_API_MAILER === "true";
  if (useGmail) {
    return new GmailApiMailer();
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (resendKey && from) {
    return new ResendEmailMailer(resendKey, from);
  }

  return new LogOnlyEmailMailer();
}
