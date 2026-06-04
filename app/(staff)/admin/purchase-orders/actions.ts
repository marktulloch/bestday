"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import type { Json, PurchaseOrderFulfilmentRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const statusEnum = z.enum([
  "draft",
  "awaiting_payment",
  "paid",
  "awaiting_fulfilment",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
]);

const deliveryStatusEnum = z.enum([
  "pending",
  "awaiting_pickup",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
]);

function trimOrNull(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export async function adminUpdatePurchaseOrderStatus(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = z
    .object({
      orderId: uuid,
      status: statusEnum,
    })
    .safeParse({
      orderId: formData.get("orderId"),
      status: formData.get("status"),
    });
  if (!parsed.success) return;

  const { data: priorPo } = await looseDb(supabase)
    .from("purchase_orders")
    .select("status, customer_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  const now = new Date().toISOString();
  await looseDb(supabase)
    .from("purchase_orders")
    .update({ status: parsed.data.status, updated_at: now })
    .eq("id", parsed.data.orderId);

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_order_status_admin,
    entityType: "purchase_order",
    entityId: parsed.data.orderId,
    metadata: {
      from_status: priorPo?.status ?? null,
      to_status: parsed.data.status,
      customer_id: priorPo?.customer_id ?? null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${parsed.data.orderId}`);
}

export async function adminUpdatePurchaseOrderFulfilment(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dispatchedRaw = trimOrNull(formData.get("dispatchedAt"), 40);
  let dispatchedAt: string | null = null;
  if (dispatchedRaw) {
    const d = new Date(dispatchedRaw);
    if (!Number.isNaN(d.getTime())) dispatchedAt = d.toISOString();
  }

  const parsed = z
    .object({
      orderId: uuid,
      courier: z.string().trim().max(120).optional(),
      trackingNumber: z.string().trim().max(200).optional(),
      fulfilmentNotes: z.string().trim().max(4000).optional(),
      deliveryStatus: deliveryStatusEnum,
    })
    .safeParse({
      orderId: formData.get("orderId"),
      courier: formData.get("courier") ?? "",
      trackingNumber: formData.get("trackingNumber") ?? "",
      fulfilmentNotes: formData.get("fulfilmentNotes") ?? "",
      deliveryStatus: formData.get("deliveryStatus"),
    });
  if (!parsed.success) return;

  const courier = trimOrNull(parsed.data.courier, 120);
  const trackingNumber = trimOrNull(parsed.data.trackingNumber, 200);
  const fulfilmentNotes = trimOrNull(parsed.data.fulfilmentNotes, 4000);

  const { data: prior } = await looseDb(supabase)
    .from("purchase_order_fulfilment")
    .select("*")
    .eq("purchase_order_id", parsed.data.orderId)
    .maybeSingle();

  const before = prior as PurchaseOrderFulfilmentRow | null;

  const now = new Date().toISOString();
  const payload = {
    purchase_order_id: parsed.data.orderId,
    courier,
    tracking_number: trackingNumber,
    fulfilment_notes: fulfilmentNotes,
    dispatched_at: dispatchedAt,
    delivery_status: parsed.data.deliveryStatus,
    updated_at: now,
  };

  const { error } = await looseDb(supabase).from("purchase_order_fulfilment").upsert(payload, {
    onConflict: "purchase_order_id",
  });
  if (error) return;

  const afterFields = {
    courier,
    tracking_number: trackingNumber,
    fulfilment_notes: fulfilmentNotes,
    dispatched_at: dispatchedAt,
    delivery_status: parsed.data.deliveryStatus,
  };

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(afterFields) as (keyof typeof afterFields)[]) {
    const prev = before?.[key as keyof PurchaseOrderFulfilmentRow] ?? null;
    const next = afterFields[key];
    const same =
      prev === next ||
      (prev == null && next == null) ||
      String(prev ?? "") === String(next ?? "");
    if (!same) {
      changes[key] = { from: prev, to: next };
    }
  }

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_order_fulfilment_admin,
    entityType: "purchase_order",
    entityId: parsed.data.orderId,
    metadata: { changes } as Json,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${parsed.data.orderId}`);
  revalidatePath("/portal/orders");
  revalidatePath(`/portal/orders/${parsed.data.orderId}`);
}
