import { createClient } from "@/lib/supabase/server";
import type { ConsultationServiceRow } from "@/lib/database.types";
import { looseDb } from "@/lib/supabase/loose-client";

/** Active catalogue rows for booking UI (respects RLS). */
export async function listActiveConsultationServices(): Promise<ConsultationServiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultation_services")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as ConsultationServiceRow[];
}

export async function getActiveConsultationServiceById(
  id: string,
): Promise<ConsultationServiceRow | null> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("consultation_services")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as ConsultationServiceRow;
}
