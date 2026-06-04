import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient<Database>;

export function normalizeCalendlyEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

/**
 * Maps a Calendly invitee email to Supabase auth user id via public.profiles.email.
 * Logs a warning when no profile matches; the webhook should not fail as a result.
 */
export async function matchCalendlyInviteeToUser(
  admin: Admin,
  rawEmail: unknown,
): Promise<string | null> {
  const email = normalizeCalendlyEmail(rawEmail);
  if (!email) {
    console.warn("[calendly] matchCalendlyInviteeToUser: missing or empty email");
    return null;
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.warn("[calendly] matchCalendlyInviteeToUser: profiles lookup failed", error.message);
    return null;
  }

  const userId = profile?.id ?? null;
  if (!userId) {
    console.warn(
      `[calendly] matchCalendlyInviteeToUser: no profile for email "${email}" — appointment will be unmatched to auth user`,
    );
  }

  return userId;
}
