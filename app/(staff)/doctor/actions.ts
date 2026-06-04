"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const noteSchema = z.object({
  customerId: uuid,
  body: z.string().trim().min(1, "Note cannot be empty").max(20000),
  appointmentId: z.string().uuid().optional().nullable(),
});

const recommendationSchema = z.object({
  customerId: uuid,
  title: z.string().trim().min(1).max(200),
  detail: z.string().trim().max(20000).optional().default(""),
  outcome: z.enum([
    "follow_up",
    "monitoring",
    "refer_external",
    "care_complete",
    "other",
  ]),
});

const orderCreateSchema = z.object({
  customerId: uuid,
  productName: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const orderStatusSchema = z.object({
  customerId: uuid,
  orderId: uuid,
  status: z.enum(["approved", "rejected", "cancelled"]),
});

export async function addConsultationNote(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const parsed = noteSchema.safeParse({
    customerId: formData.get("customerId"),
    body: formData.get("body"),
    appointmentId: formData.get("appointmentId") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await looseDb(supabase).from("consultation_notes").insert({
    customer_id: parsed.data.customerId,
    author_user_id: user.id,
    appointment_id: parsed.data.appointmentId ?? null,
    body: parsed.data.body,
  });

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.consultation_note_created,
    entityType: "customer",
    entityId: parsed.data.customerId,
    metadata: { appointment_id: parsed.data.appointmentId },
  });

  revalidatePath(`/doctor/patients/${parsed.data.customerId}`);
  return { ok: true };
}

export async function addConsultationRecommendation(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const parsed = recommendationSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    detail: formData.get("detail") ?? "",
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await looseDb(supabase).from("consultation_recommendations").insert({
    customer_id: parsed.data.customerId,
    author_user_id: user.id,
    title: parsed.data.title,
    detail: parsed.data.detail,
    outcome: parsed.data.outcome,
  });

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.consultation_recommendation_created,
    entityType: "customer",
    entityId: parsed.data.customerId,
    metadata: { outcome: parsed.data.outcome, title: parsed.data.title },
  });

  revalidatePath(`/doctor/patients/${parsed.data.customerId}`);
  return { ok: true };
}

export async function createCustomerOrder(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const parsed = orderCreateSchema.safeParse({
    customerId: formData.get("customerId"),
    productName: formData.get("productName"),
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

  const { error } = await looseDb(supabase).from("customer_orders").insert({
    customer_id: parsed.data.customerId,
    product_name: parsed.data.productName,
    product_id: null,
    notes: parsed.data.notes,
    created_by_user_id: user.id,
    status: "pending_review",
  });

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.customer_order_created,
    entityType: "customer",
    entityId: parsed.data.customerId,
    metadata: { product_name: parsed.data.productName },
  });

  revalidatePath(`/doctor/patients/${parsed.data.customerId}`);
  return { ok: true };
}

export async function updateCustomerOrderStatus(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const parsed = orderStatusSchema.safeParse({
    customerId: formData.get("customerId"),
    orderId: formData.get("orderId"),
    status: formData.get("status"),
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
  const approved =
    parsed.data.status === "approved" || parsed.data.status === "rejected" ? user.id : null;
  const approvedAt =
    parsed.data.status === "approved" || parsed.data.status === "rejected" ? now : null;

  const { error } = await looseDb(supabase)
    .from("customer_orders")
    .update({
      status: parsed.data.status,
      approved_by_user_id: approved,
      approved_at: approvedAt,
      updated_at: now,
    })
    .eq("id", parsed.data.orderId)
    .eq("customer_id", parsed.data.customerId);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.customer_order_status_updated,
    entityType: "customer_order",
    entityId: parsed.data.orderId,
    metadata: { status: parsed.data.status, customer_id: parsed.data.customerId },
  });

  revalidatePath(`/doctor/patients/${parsed.data.customerId}`);
  return { ok: true };
}

export async function togglePatientAssignment(
  customerId: string,
  assign: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const idParse = uuid.safeParse(customerId);
  if (!idParse.success) return { ok: false, error: "Invalid patient" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  if (assign) {
    const { error } = await looseDb(supabase).from("doctor_patient_assignments").upsert(
      {
        doctor_user_id: user.id,
        customer_id: idParse.data,
      },
      { onConflict: "doctor_user_id,customer_id" },
    );
    if (error) return { ok: false, error: error.message };
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTION.doctor_patient_assigned,
      entityType: "customer",
      entityId: idParse.data,
    });
  } else {
    const { error } = await looseDb(supabase)
      .from("doctor_patient_assignments")
      .delete()
      .eq("doctor_user_id", user.id)
      .eq("customer_id", idParse.data);
    if (error) return { ok: false, error: error.message };
    await logAuditEvent({
      actorId: user.id,
      action: AUDIT_ACTION.doctor_patient_unassigned,
      entityType: "customer",
      entityId: idParse.data,
    });
  }

  revalidatePath("/doctor");
  revalidatePath(`/doctor/patients/${idParse.data}`);
  return { ok: true };
}
