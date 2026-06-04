import { reconcileCalendlyWebhook } from "@/lib/booking/reconcile-calendly-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allow =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_CALENDLY_WEBHOOK_TEST === "true";

/** POST raw Calendly-shaped JSON through the same handler as production (admin client + reconcile). */
export async function POST(request: Request) {
  if (!allow) {
    return Response.json({ error: "not_enabled" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await reconcileCalendlyWebhook(admin, body);
    return Response.json(result, { status: 200 });
  } catch (e) {
    console.error("[calendly-webhook-test]", e);
    return Response.json({ error: "reconcile_failed" }, { status: 500 });
  }
}

export async function GET() {
  if (!allow) {
    return Response.json({ error: "not_enabled" }, { status: 404 });
  }
  return Response.json({
    hint: "POST a Calendly webhook JSON body. See SAMPLE_* in lib/booking/calendly-webhook-samples.ts",
  });
}
