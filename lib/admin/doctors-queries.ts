import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { ProfileRow } from "@/lib/database.types";

export type DoctorAdminRow = Pick<ProfileRow, "id" | "email" | "full_name" | "role" | "created_at">;

export async function listDoctorsForAdmin(search?: string | null): Promise<DoctorAdminRow[]> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  let q = db
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("role", "doctor")
    .order("full_name", { ascending: true, nullsFirst: false })
    .limit(150);

  const term = search?.trim().replace(/[%_]/g, "").slice(0, 80) ?? "";
  if (term.length > 0) {
    q = q.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return data as DoctorAdminRow[];
}

export async function countDoctorPatientAssignments(doctorUserId: string): Promise<number> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const { count } = await db
    .from("doctor_patient_assignments")
    .select("customer_id", { count: "exact", head: true })
    .eq("doctor_user_id", doctorUserId);
  return count ?? 0;
}

export async function getDoctorProfileForAdmin(userId: string): Promise<DoctorAdminRow | null> {
  const supabase = await createClient();
  const db = looseDb(supabase);
  const { data } = await db
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .eq("role", "doctor")
    .maybeSingle();
  return (data as DoctorAdminRow | null) ?? null;
}
