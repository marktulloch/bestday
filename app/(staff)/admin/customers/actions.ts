"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const customerStatus = z.enum(["draft", "active", "archived"]);

export async function adminUpdateCustomer(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = z
    .object({
      customerId: uuid,
      status: customerStatus,
      phone: z.string().trim().max(40).optional(),
      region: z.string().trim().max(80).optional(),
    })
    .safeParse({
      customerId: formData.get("customerId"),
      status: formData.get("status"),
      phone: formData.get("phone") ?? "",
      region: formData.get("region") ?? "",
    });
  if (!parsed.success) return;

  const phone = parsed.data.phone && parsed.data.phone.length > 0 ? parsed.data.phone : null;
  const region = parsed.data.region && parsed.data.region.length > 0 ? parsed.data.region : null;
  const now = new Date().toISOString();

  const { data: prior } = await looseDb(supabase)
    .from("customers")
    .select("status, phone, region")
    .eq("id", parsed.data.customerId)
    .maybeSingle();

  await looseDb(supabase)
    .from("customers")
    .update({
      status: parsed.data.status,
      phone,
      region,
      updated_at: now,
    })
    .eq("id", parsed.data.customerId);

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.customer_record_updated,
    entityType: "customer",
    entityId: parsed.data.customerId,
    metadata: {
      before: prior ?? null,
      after: { status: parsed.data.status, phone, region },
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
}
