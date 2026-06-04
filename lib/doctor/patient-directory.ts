import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { CustomerRow, ProfileRow } from "@/lib/database.types";

export type DoctorPatientListRow = CustomerRow & {
  profile: Pick<ProfileRow, "id" | "email" | "full_name"> | null;
  assignedToMe: boolean;
};

export async function getDoctorPatientDirectory(
  doctorUserId: string,
): Promise<DoctorPatientListRow[]> {
  const supabase = await createClient();

  const { data: customers, error: cErr } = await looseDb(supabase)
    .from("customers")
    .select("id, user_id, status, phone, region, metadata, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (cErr || !customers?.length) {
    return [];
  }

  const rows = customers as CustomerRow[];
  const userIds = [...new Set(rows.map((c) => c.user_id))];
  const { data: profiles } = await looseDb(supabase)
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileRows = (profiles ?? []) as Pick<ProfileRow, "id" | "email" | "full_name">[];
  const profileByUserId = new Map(profileRows.map((p) => [p.id, p]));

  const { data: assigns } = await looseDb(supabase)
    .from("doctor_patient_assignments")
    .select("customer_id")
    .eq("doctor_user_id", doctorUserId);

  const assignRows = (assigns ?? []) as { customer_id: string }[];
  const assigned = new Set(assignRows.map((a) => a.customer_id));

  return rows.map((c) => ({
    ...(c as CustomerRow),
    profile: profileByUserId.get(c.user_id) ?? null,
    assignedToMe: assigned.has(c.id),
  }));
}
