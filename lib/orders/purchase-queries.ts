import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type {
  PurchaseOrderFulfilmentRow,
  PurchaseOrderItemRow,
  PurchaseOrderRow,
} from "@/lib/database.types";

export type PurchaseOrderWithItems = PurchaseOrderRow & {
  items: PurchaseOrderItemRow[];
  fulfilment: PurchaseOrderFulfilmentRow | null;
};

export type PurchaseOrderSummary = Pick<
  PurchaseOrderRow,
  "id" | "status" | "placed_at" | "total_cents" | "currency"
>;

async function fetchFulfilmentRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  purchaseOrderId: string,
): Promise<PurchaseOrderFulfilmentRow | null> {
  const { data } = await looseDb(supabase)
    .from("purchase_order_fulfilment")
    .select("*")
    .eq("purchase_order_id", purchaseOrderId)
    .maybeSingle();
  return (data as PurchaseOrderFulfilmentRow | null) ?? null;
}

export async function fetchFulfilmentByOrderIds(orderIds: string[]): Promise<Map<string, PurchaseOrderFulfilmentRow>> {
  if (orderIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("purchase_order_fulfilment")
    .select("*")
    .in("purchase_order_id", orderIds);
  const map = new Map<string, PurchaseOrderFulfilmentRow>();
  for (const row of (data ?? []) as PurchaseOrderFulfilmentRow[]) {
    map.set(row.purchase_order_id, row);
  }
  return map;
}

export async function getCustomerIdForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getDraftOrderForCustomer(customerId: string): Promise<PurchaseOrderWithItems | null> {
  const supabase = await createClient();
  const { data: order } = await looseDb(supabase)
    .from("purchase_orders")
    .select("*")
    .eq("customer_id", customerId)
    .eq("status", "draft")
    .maybeSingle();

  if (!order) return null;
  const o = order as PurchaseOrderRow;

  const { data: items } = await looseDb(supabase)
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", o.id)
    .order("created_at", { ascending: true });

  return { ...o, items: (items ?? []) as PurchaseOrderItemRow[], fulfilment: null };
}

export async function getPurchaseOrderForCustomer(
  customerId: string,
  orderId: string,
): Promise<PurchaseOrderWithItems | null> {
  const supabase = await createClient();
  const { data: order } = await looseDb(supabase)
    .from("purchase_orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!order) return null;
  const o = order as PurchaseOrderRow;

  const [{ data: items }, fulfilment] = await Promise.all([
    looseDb(supabase)
      .from("purchase_order_items")
      .select("*")
      .eq("purchase_order_id", o.id)
      .order("created_at", { ascending: true }),
    fetchFulfilmentRow(supabase, o.id),
  ]);

  return { ...o, items: (items ?? []) as PurchaseOrderItemRow[], fulfilment };
}

/** For support forms: submitted orders only (excludes cart). */
export async function listSubmittedPurchaseOrdersForCustomer(
  customerId: string,
): Promise<PurchaseOrderSummary[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("purchase_orders")
    .select("id, status, placed_at, total_cents, currency")
    .eq("customer_id", customerId)
    .neq("status", "draft")
    .order("placed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as PurchaseOrderSummary[];
}

/** Non-draft history + current draft flag separately in UI */
export async function listPurchaseOrdersForCustomer(customerId: string): Promise<PurchaseOrderRow[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("purchase_orders")
    .select("*")
    .eq("customer_id", customerId)
    .neq("status", "draft")
    .order("placed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as PurchaseOrderRow[];
}

export async function listAllPurchaseOrdersForAdmin(): Promise<PurchaseOrderRow[]> {
  const supabase = await createClient();
  const { data } = await looseDb(supabase)
    .from("purchase_orders")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (data ?? []) as PurchaseOrderRow[];
}

export async function getPurchaseOrderForAdmin(orderId: string): Promise<PurchaseOrderWithItems | null> {
  const supabase = await createClient();
  const { data: order } = await looseDb(supabase).from("purchase_orders").select("*").eq("id", orderId).maybeSingle();

  if (!order) return null;
  const o = order as PurchaseOrderRow;

  const [{ data: items }, fulfilment] = await Promise.all([
    looseDb(supabase)
      .from("purchase_order_items")
      .select("*")
      .eq("purchase_order_id", o.id)
      .order("created_at", { ascending: true }),
    fetchFulfilmentRow(supabase, o.id),
  ]);

  return { ...o, items: (items ?? []) as PurchaseOrderItemRow[], fulfilment };
}
