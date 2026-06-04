import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Use your Supabase API URL (https://…supabase.co), not a postgres:// connection string.",
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://");
  }
  if (!parsed.hostname) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must include a hostname");
  }
  return trimmed;
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl?.trim()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  const url = normalizeSupabaseUrl(rawUrl);
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient<Database>(url, key);
}
