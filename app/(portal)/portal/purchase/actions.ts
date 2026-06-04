"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { getAuthContext } from "@/lib/auth/session";
import {
  mcPrescreenBlocksPortalCommerce,
  mcPrescreenCommerceBlockPublicMessage,
} from "@/lib/mc-flow/commerce-gate";
import { capturePlaceholderPayment } from "@/lib/payments";
import { getCustomerIdForUser, getDraftOrderForCustomer, getPurchaseOrderForCustomer } from "@/lib/orders/purchase-queries";
import { recalcPurchaseOrderTotals } from "@/lib/orders/recalc-totals";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

async function requireCustomerPurchaseContext(): Promise<
  { ok: true; userId: string; customerId: string } | { ok: false; error: string }
> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "Not signed in" };
  if (ctx.profile.role !== "customer") return { ok: false, error: "Only patients can place orders here." };
  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) return { ok: false, error: "No customer profile is linked to this account." };
  return { ok: true, userId: ctx.user.id, customerId };
}

async function requireMcCommerceOk(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await mcPrescreenBlocksPortalCommerce(userId)) {
    return { ok: false, error: mcPrescreenCommerceBlockPublicMessage() };
  }
  return { ok: true };
}

async function getOrCreateDraftOrderId(supabase: Awaited<ReturnType<typeof createClient>>, customerId: string) {
  const { data: existing } = await looseDb(supabase)
    .from("purchase_orders")
    .select("id")
    .eq("customer_id", customerId)
    .eq("status", "draft")
    .maybeSingle();

  if ((existing as { id: string } | null)?.id) return (existing as { id: string }).id;

  const { data: inserted, error } = await looseDb(supabase)
    .from("purchase_orders")
    .insert({ customer_id: customerId, status: "draft" })
    .select("id")
    .single();

  if (error) {
    const { data: again } = await looseDb(supabase)
      .from("purchase_orders")
      .select("id")
      .eq("customer_id", customerId)
      .eq("status", "draft")
      .maybeSingle();
    if ((again as { id: string } | null)?.id) return (again as { id: string }).id;
    throw new Error(error.message);
  }

  return (inserted as { id: string }).id;
}

export async function addPurchaseLine(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z
    .object({
      productId: uuid,
      quantity: z.coerce.number().int().min(1).max(20),
      revalidateSlug: z.string().trim().max(200).optional(),
    })
    .safeParse({
      productId: formData.get("productId"),
      quantity: formData.get("quantity") ?? 1,
      revalidateSlug: formData.get("revalidateSlug") || undefined,
    });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return { ok: false, error: gate.error };
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return { ok: false, error: mc.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: canOrder, error: rpcErr } = await looseDb(supabase).rpc("customer_can_order_product", {
    p_customer_id: gate.customerId,
    p_product_id: parsed.data.productId,
  });

  if (rpcErr || !canOrder) {
    return { ok: false, error: "This product is not available for your account." };
  }

  const { data: product, error: pErr } = await looseDb(supabase)
    .from("products")
    .select("id, name, sku, price_cents")
    .eq("id", parsed.data.productId)
    .maybeSingle();

  if (pErr || !product) return { ok: false, error: "Product not found." };
  const p = product as { id: string; name: string; sku: string; price_cents: number };

  const orderId = await getOrCreateDraftOrderId(supabase, gate.customerId);

  const { data: existingLine } = await looseDb(supabase)
    .from("purchase_order_items")
    .select("id, quantity, unit_price_cents")
    .eq("purchase_order_id", orderId)
    .eq("product_id", p.id)
    .maybeSingle();

  const now = new Date().toISOString();
  const unit = p.price_cents;

  if (existingLine) {
    const line = existingLine as { id: string; quantity: number; unit_price_cents: number };
    const qty = line.quantity + parsed.data.quantity;
    const lineTotal = qty * line.unit_price_cents;
    const { error: uErr } = await looseDb(supabase)
      .from("purchase_order_items")
      .update({ quantity: qty, line_total_cents: lineTotal, updated_at: now })
      .eq("id", line.id);
    if (uErr) return { ok: false, error: uErr.message };
  } else {
    const qty = parsed.data.quantity;
    const { error: iErr } = await looseDb(supabase).from("purchase_order_items").insert({
      purchase_order_id: orderId,
      product_id: p.id,
      quantity: qty,
      unit_price_cents: unit,
      line_total_cents: unit * qty,
      product_name_snapshot: p.name,
      sku_snapshot: p.sku,
      updated_at: now,
    });
    if (iErr) return { ok: false, error: iErr.message };
  }

  await recalcPurchaseOrderTotals(supabase, orderId);

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_cart_line_added,
    entityType: "purchase_order",
    entityId: orderId,
    metadata: { product_id: p.id, quantity: parsed.data.quantity },
  });

  revalidatePath("/portal/cart");
  revalidatePath("/portal/products");
  if (parsed.data.revalidateSlug) {
    revalidatePath(`/portal/products/${parsed.data.revalidateSlug}`);
  }
  return { ok: true };
}

export async function updatePurchaseLineQuantity(formData: FormData): Promise<void> {
  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return;
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return;

  const lineId = uuid.safeParse(formData.get("lineId"));
  const qty = z.coerce.number().int().min(1).max(20).safeParse(formData.get("quantity"));
  if (!lineId.success || !qty.success) return;

  const supabase = await createClient();
  const draft = await getDraftOrderForCustomer(gate.customerId);
  if (!draft) return;

  const line = draft.items.find((i) => i.id === lineId.data);
  if (!line) return;

  const now = new Date().toISOString();
  const lineTotal = line.unit_price_cents * qty.data;

  await looseDb(supabase)
    .from("purchase_order_items")
    .update({ quantity: qty.data, line_total_cents: lineTotal, updated_at: now })
    .eq("id", line.id);

  await recalcPurchaseOrderTotals(supabase, draft.id);
  revalidatePath("/portal/cart");
}

export async function removePurchaseLine(formData: FormData): Promise<void> {
  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return;
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return;

  const lineId = uuid.safeParse(formData.get("lineId"));
  if (!lineId.success) return;

  const supabase = await createClient();
  const draft = await getDraftOrderForCustomer(gate.customerId);
  if (!draft) return;

  if (!draft.items.some((i) => i.id === lineId.data)) return;

  await looseDb(supabase).from("purchase_order_items").delete().eq("id", lineId.data);
  await recalcPurchaseOrderTotals(supabase, draft.id);
  revalidatePath("/portal/cart");
}

export async function submitPurchaseCheckout(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return { ok: false, error: gate.error };
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return { ok: false, error: mc.error };

  const schema = z.object({
    recipientName: z.string().trim().min(1).max(200),
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(120),
    region: z.string().trim().max(120).optional().nullable(),
    postal: z.string().trim().min(1).max(20),
    country: z.string().trim().min(1).max(80).default("NZ"),
  });

  const parsed = schema.safeParse({
    recipientName: formData.get("recipientName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || null,
    city: formData.get("city"),
    region: formData.get("region") || null,
    postal: formData.get("postal"),
    country: formData.get("country") || "NZ",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const draft = await getDraftOrderForCustomer(gate.customerId);
  if (!draft || draft.items.length === 0) {
    return { ok: false, error: "Your order is empty." };
  }

  const now = new Date().toISOString();

  const { error } = await looseDb(supabase)
    .from("purchase_orders")
    .update({
      status: "awaiting_payment",
      delivery_recipient_name: parsed.data.recipientName,
      delivery_line1: parsed.data.line1,
      delivery_line2: parsed.data.line2,
      delivery_city: parsed.data.city,
      delivery_region: parsed.data.region,
      delivery_postal_code: parsed.data.postal,
      delivery_country: parsed.data.country,
      placed_at: now,
      updated_at: now,
    })
    .eq("id", draft.id)
    .eq("status", "draft");

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_order_submitted,
    entityType: "purchase_order",
    entityId: draft.id,
    metadata: { total_cents: draft.total_cents },
  });

  revalidatePath("/portal/cart");
  revalidatePath("/portal/checkout");
  revalidatePath("/portal/orders");
  revalidatePath(`/portal/orders/${draft.id}`);
  return { ok: true, orderId: draft.id };
}

export async function confirmPurchasePlaceholderPayment(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return { ok: false, error: gate.error };
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return { ok: false, error: mc.error };

  const idParse = uuid.safeParse(formData.get("orderId"));
  if (!idParse.success) return { ok: false, error: "Invalid order" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const order = await getPurchaseOrderForCustomer(gate.customerId, idParse.data);
  if (!order) return { ok: false, error: "Order not found." };

  const pay = await capturePlaceholderPayment(order);
  if (!pay.ok) return { ok: false, error: pay.message };

  const now = new Date().toISOString();
  const { error } = await looseDb(supabase)
    .from("purchase_orders")
    .update({
      status: "paid",
      payment_reference: pay.reference,
      payment_provider: "placeholder",
      updated_at: now,
    })
    .eq("id", order.id)
    .eq("status", "awaiting_payment");

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_order_paid_placeholder,
    entityType: "purchase_order",
    entityId: order.id,
    metadata: { reference: pay.reference },
  });

  revalidatePath("/portal/orders");
  revalidatePath(`/portal/orders/${order.id}`);
  return { ok: true };
}

export async function cancelPurchaseAwaitingPayment(formData: FormData): Promise<void> {
  const gate = await requireCustomerPurchaseContext();
  if (!gate.ok) return;
  const mc = await requireMcCommerceOk(gate.userId);
  if (!mc.ok) return;

  const idParse = uuid.safeParse(formData.get("orderId"));
  if (!idParse.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const order = await getPurchaseOrderForCustomer(gate.customerId, idParse.data);
  if (!order || order.status !== "awaiting_payment") return;

  const now = new Date().toISOString();
  await looseDb(supabase)
    .from("purchase_orders")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", order.id)
    .eq("status", "awaiting_payment");

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.purchase_order_cancelled_by_patient,
    entityType: "purchase_order",
    entityId: order.id,
  });

  revalidatePath("/portal/orders");
  revalidatePath(`/portal/orders/${order.id}`);
}
