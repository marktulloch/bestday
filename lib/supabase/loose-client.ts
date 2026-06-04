import type { createClient } from "@/lib/supabase/server";

/**
 * Some generated `Database` shapes do not satisfy the library's `GenericSchema` check, so
 * `from("…")` can infer `never` for newer tables. Use only where row shapes are validated in code.
 *
 * Typed as `any` intentionally: casting to `SupabaseClient<Database>` forces strict embed/insert
 * checks that currently fail on several tables until the generated types align with PostgREST.
 */
export function looseDb(client: Awaited<ReturnType<typeof createClient>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any;
}
