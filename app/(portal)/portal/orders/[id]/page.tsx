import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OrderProgressTimeline } from "@/app/components/portal/OrderProgressTimeline";
import { cancelPurchaseAwaitingPayment } from "@/app/(portal)/portal/purchase/actions";
import { PlaceholderPayForm } from "@/app/components/portal/PlaceholderPayForm";
import { getAuthContext } from "@/lib/auth/session";
import type { PurchaseOrderStatus } from "@/lib/database.types";
import { formatPrice } from "@/lib/products/format-price";
import { getCustomerIdForUser, getPurchaseOrderForCustomer } from "@/lib/orders/purchase-queries";
import { buildOrderTimeline, purchaseDeliveryStatusLabel } from "@/lib/orders/order-timeline";

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

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/orders");
  if (ctx.profile.role !== "customer") redirect("/admin/orders");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  const { id } = await params;
  const order = await getPurchaseOrderForCustomer(customerId, id);
  if (!order) notFound();

  if (order.status === "draft") {
    redirect("/portal/cart");
  }

  const f = order.fulfilment;
  const timeline = buildOrderTimeline({
    orderStatus: order.status,
    placedAt: order.placed_at,
    deliveryStatus: f?.delivery_status ?? null,
    dispatchedAt: f?.dispatched_at ?? null,
    courier: f?.courier ?? null,
    trackingNumber: f?.tracking_number ?? null,
  });

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link href="/portal/orders" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Order history
      </Link>
      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{order.id}</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 tracking-tight">
          {statusLabel(order.status)}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Total{" "}
          <span className="font-semibold text-gray-900 tabular-nums">
            {formatPrice(order.total_cents, order.currency)}
          </span>
        </p>
        {order.placed_at ? (
          <p className="text-xs text-gray-500 mt-2">
            Placed {new Date(order.placed_at).toLocaleString("en-NZ")}
          </p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Progress</h2>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            Status updates as your order is paid, packed, and shipped. Tracking appears when dispatch is recorded.
          </p>
          <div className="mt-6">
            <OrderProgressTimeline steps={timeline} />
          </div>
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Delivery address</h2>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p className="font-medium">{order.delivery_recipient_name ?? "—"}</p>
              <p>{order.delivery_line1 ?? "—"}</p>
              {order.delivery_line2 ? <p>{order.delivery_line2}</p> : null}
              <p>
                {[order.delivery_city, order.delivery_region, order.delivery_postal_code]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>{order.delivery_country}</p>
            </div>
          </section>

          {f ? (
            <section className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Shipment</h2>
              <dl className="mt-3 text-sm text-gray-700 space-y-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Parcel status</dt>
                  <dd>{purchaseDeliveryStatusLabel(f.delivery_status)}</dd>
                </div>
                {f.courier ? (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Courier</dt>
                    <dd>{f.courier}</dd>
                  </div>
                ) : null}
                {f.tracking_number ? (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Tracking</dt>
                    <dd className="font-mono text-xs break-all">{f.tracking_number}</dd>
                  </div>
                ) : null}
                {f.dispatched_at ? (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Dispatched</dt>
                    <dd>{new Date(f.dispatched_at).toLocaleString("en-NZ")}</dd>
                  </div>
                ) : null}
                {f.fulfilment_notes ? (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Message from the team</dt>
                    <dd className="text-gray-800 leading-relaxed whitespace-pre-wrap">{f.fulfilment_notes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Items</h2>
            <ul className="mt-3 divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {order.items.map((line) => (
                <li key={line.id} className="px-3 py-2 flex justify-between gap-4 text-sm">
                  <span>
                    {line.product_name_snapshot}{" "}
                    <span className="text-gray-500">×{line.quantity}</span>
                  </span>
                  <span className="tabular-nums text-gray-900 shrink-0">
                    {formatPrice(line.line_total_cents, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-10 space-y-4 max-w-md">
        {order.status === "awaiting_payment" ? (
          <>
            <PlaceholderPayForm orderId={order.id} />
            <form action={cancelPurchaseAwaitingPayment}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="text-sm text-gray-600 hover:text-red-700 hover:underline">
                Cancel order
              </button>
            </form>
          </>
        ) : null}

        {order.status === "paid" || order.status === "awaiting_fulfilment" ? (
          <p className="text-sm text-gray-600">
            Your order is with the team for packing and dispatch. You&apos;ll see updates on this page.
          </p>
        ) : null}

        {order.payment_reference ? (
          <p className="text-xs text-gray-500 font-mono">Reference: {order.payment_reference}</p>
        ) : null}
      </div>
    </div>
  );
}
