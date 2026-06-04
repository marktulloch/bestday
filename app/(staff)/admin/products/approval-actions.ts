"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const approvalSchema = z.object({
  customerId: uuid,
  productId: uuid,
  status: z.enum(["pending", "approved", "revoked"]),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function upsertCustomerProductApproval(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const parsed = approvalSchema.safeParse({
    customerId: formData.get("customerId"),
    productId: formData.get("productId"),
    status: formData.get("status"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const now = new Date().toISOString();
  const approvedAt =
    parsed.data.status === "approved" ? now : null;
  const approvedBy = parsed.data.status === "approved" ? user.id : null;

  const { error } = await looseDb(supabase).from("customer_product_approvals").upsert(
    {
      customer_id: parsed.data.customerId,
      product_id: parsed.data.productId,
      status: parsed.data.status,
      notes: parsed.data.notes,
      approved_by_user_id: approvedBy,
      approved_at: approvedAt,
      updated_at: now,
    },
    { onConflict: "customer_id,product_id" },
  );

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.customer_product_approval_upserted,
    entityType: "customer",
    entityId: parsed.data.customerId,
    metadata: {
      product_id: parsed.data.productId,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/products/approvals");
  revalidatePath(`/doctor/patients/${parsed.data.customerId}`);
  revalidatePath("/portal/products");
  return { ok: true };
}
