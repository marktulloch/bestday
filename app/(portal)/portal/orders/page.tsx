import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { formatPrice } from "@/lib/products/format-price";
import {
  fetchFulfilmentByOrderIds,
  getCustomerIdForUser,
  listPurchaseOrdersForCustomer,
} from "@/lib/orders/purchase-queries";
import type { PurchaseOrderStatus } from "@/lib/database.types";
import { purchaseDeliveryStatusLabel } from "@/lib/orders/order-timeline";

export const dynamic = "force-dynamic";

function statusLabel(s: PurchaseOrderStatus): string {
  const map: Record<PurchaseOrderStatus, string> = {
    draft: "Draft",
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    awaiting_fulfilment: "Awaiting fulfilment",
    packed: "Packed",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[s] ?? s;
}

export default async function PortalOrdersHistoryPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/orders");
  if (ctx.profile.role !== "customer") redirect("/admin/orders");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  const orders = await listPurchaseOrdersForCustomer(customerId);
  const fulfilmentByOrder = await fetchFulfilmentByOrderIds(orders.map((o) => o.id));

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Order history</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track payment and delivery for orders you&apos;ve placed through the portal.
          </p>
        </div>
        <Link
          href="/portal/cart"
          className="text-sm font-medium text-[#4EDD00] hover:underline shrink-0"
        >
          Current order / cart →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center text-sm text-gray-600">
          <p>No submitted orders yet.</p>
          <Link href="/portal/products" className="mt-2 inline-block text-[#4EDD00] font-medium hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const ship = fulfilmentByOrder.get(o.id);
            return (
              <li key={o.id}>
                <Link
                  href={`/portal/orders/${o.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order <span className="font-mono text-xs">{o.id.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {o.placed_at
                        ? `Placed ${new Date(o.placed_at).toLocaleString("en-NZ")}`
                        : `Created ${new Date(o.created_at).toLocaleString("en-NZ")}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <span className="text-gray-600">{statusLabel(o.status)}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatPrice(o.total_cents, o.currency)}
                      </span>
                    </div>
                    {ship ? (
                      <span className="text-xs text-gray-500">
                        Delivery: {purchaseDeliveryStatusLabel(ship.delivery_status)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
