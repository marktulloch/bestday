import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCalendlyWebhookSignature } from "@/lib/booking/calendly-verify";
import { reconcileCalendlyWebhook } from "@/lib/booking/reconcile-calendly-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  const isDev = process.env.NODE_ENV === "development";
  const skipVerify =
    process.env.CALENDLY_SKIP_WEBHOOK_VERIFY === "true" ||
    (isDev && !signingKey?.trim());

  if (!skipVerify) {
    if (!signingKey?.trim()) {
      return Response.json({ error: "CALENDLY_WEBHOOK_SIGNING_KEY not configured" }, { status: 503 });
    }
    const signatureHeader =
      request.headers.get("Calendly-Webhook-Signature") ??
      request.headers.get("calendly-webhook-signature");
    if (!verifyCalendlyWebhookSignature(rawBody, signatureHeader, signingKey)) {
      return Response.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await reconcileCalendlyWebhook(admin, body);
    return Response.json(result, { status: 200 });
  } catch (e) {
    console.error("[calendly webhook]", e);
    return Response.json({ error: "reconcile_failed" }, { status: 500 });
  }
}

export async function GET() {
  return new Response(null, { status: 405 });
}
