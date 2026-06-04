import { processDueNotifications } from "@/lib/notifications/process-due-notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret =
    process.env.CRON_SECRET?.trim() ?? process.env.NOTIFICATIONS_CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "server_misconfigured" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();
    const result = await processDueNotifications(admin, { limit: 50 });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/notifications]", e);
    return Response.json({ error: "process_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
