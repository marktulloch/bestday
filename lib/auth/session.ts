import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
  profile: ProfileRow;
};

/**
 * Current Supabase Auth user, or null if signed out.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Profile row for the current user (RLS applies). Null if signed out or missing row.
 */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * User + profile when both exist.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  return { user, profile };
}
