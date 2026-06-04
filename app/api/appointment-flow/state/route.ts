import { getAppointmentFlowState } from "@/lib/appointment-flow/state";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the patient’s MC appointment journey state (steps 1–6) for the signed-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return Response.json({ error: "You must be signed in." }, { status: 401 });
  }

  const state = await getAppointmentFlowState(supabase, user.id);
  return Response.json(state);
}
