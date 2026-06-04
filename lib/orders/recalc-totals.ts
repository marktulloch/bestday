import type { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

type Sb = Awaited<ReturnType<typeof createClient>>;

export async function recalcPurchaseOrderTotals(supabase: Sb, purchaseOrderId: string): Promise<void> {
  const { data: lines } = await looseDb(supabase)
    .from("purchase_order_items")
    .select("line_total_cents")
    .eq("purchase_order_id", purchaseOrderId);

  const rows = (lines ?? []) as { line_total_cents: number }[];
  const subtotal = rows.reduce((s, r) => s + r.line_total_cents, 0);
  const now = new Date().toISOString();

  await looseDb(supabase)
    .from("purchase_orders")
    .update({
      subtotal_cents: subtotal,
      total_cents: subtotal,
      updated_at: now,
    })
    .eq("id", purchaseOrderId);
}
