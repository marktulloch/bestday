import Link from "next/link";

import {
  adminUpdatePurchaseOrderFulfilment,
  adminUpdatePurchaseOrderStatus,
} from "@/app/(staff)/admin/purchase-orders/actions";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { PurchaseDeliveryStatus, PurchaseOrderStatus } from "@/lib/database.types";
import { purchaseDeliveryStatusLabel } from "@/lib/orders/order-timeline";
import { formatPrice } from "@/lib/products/format-price";
import type { PurchaseOrderWithItems } from "@/lib/orders/purchase-queries";

const STATUSES: PurchaseOrderStatus[] = [
  "draft",
  "awaiting_payment",
  "paid",
  "awaiting_fulfilment",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
];

const DELIVERY_STATUSES: PurchaseDeliveryStatus[] = [
  "pending",
  "awaiting_pickup",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function AdminPurchaseOrderDetail({
  order,
  listHref,
  listLabel = "All orders",
}: {
  order: PurchaseOrderWithItems;
  listHref: string;
  listLabel?: string;
}) {
  const supabase = await createClient();
  const { data: cust } = await looseDb(supabase)
    .from("customers")
    .select("user_id")
    .eq("id", order.customer_id)
    .maybeSingle();
  const uid = (cust as { user_id: string } | null)?.user_id;
  const { data: prof } = uid
    ? await looseDb(supabase).from("profiles").select("email, full_name").eq("id", uid).maybeSingle()
    : { data: null };
  const profile = prof as { email: string | null; full_name: string | null } | null;

  return (
    <div>
      <Link href={listHref} className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← {listLabel}
      </Link>
      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{order.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Order detail</h1>
        <p className="mt-2 text-sm text-gray-600">
          Patient:{" "}
          <span className="font-medium text-gray-900">
            {profile?.full_name || profile?.email || "—"}
          </span>
          <span className="block mt-1">
            <Link
              href={`/admin/customers/${order.customer_id}`}
              className="text-sm text-[#4EDD00] font-medium hover:underline"
            >
              Customer record →
            </Link>
          </span>
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Order workflow</h2>
          <form action={adminUpdatePurchaseOrderStatus} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="text-sm">
              <span className="block text-xs font-medium text-gray-600 mb-1">Status</span>
              <select
                name="status"
                defaultValue={order.status}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm min-w-[200px]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Save
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500">
            Payment provider: {order.payment_provider}
            {order.payment_reference ? ` · ${order.payment_reference}` : ""}
          </p>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Delivery &amp; tracking</h2>
          <p className="mt-1 text-xs text-gray-500 max-w-2xl">
            Shipment details are saved separately from the order status above. Patients see tracking, courier, dispatch
            time, and notes you add here. Courier API hooks can populate{" "}
            <span className="font-mono">courier_metadata</span> later.
          </p>
          <form action={adminUpdatePurchaseOrderFulfilment} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="text-sm sm:col-span-1">
              <span className="block text-xs font-medium text-gray-600 mb-1">Delivery status (parcel)</span>
              <select
                name="deliveryStatus"
                defaultValue={order.fulfilment?.delivery_status ?? "pending"}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {DELIVERY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {purchaseDeliveryStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-1">
              <span className="block text-xs font-medium text-gray-600 mb-1">Dispatch date &amp; time</span>
              <input
                type="datetime-local"
                name="dispatchedAt"
                defaultValue={
                  order.fulfilment?.dispatched_at ? toDatetimeLocalValue(order.fulfilment.dispatched_at) : ""
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-1">
              <span className="block text-xs font-medium text-gray-600 mb-1">Courier</span>
              <input
                name="courier"
                type="text"
                defaultValue={order.fulfilment?.courier ?? ""}
                placeholder="e.g. NZ Post"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm sm:col-span-1">
              <span className="block text-xs font-medium text-gray-600 mb-1">Tracking number</span>
              <input
                name="trackingNumber"
                type="text"
                defaultValue={order.fulfilment?.tracking_number ?? ""}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="block text-xs font-medium text-gray-600 mb-1">
                Fulfilment notes (visible to patient)
              </span>
              <textarea
                name="fulfilmentNotes"
                rows={3}
                defaultValue={order.fulfilment?.fulfilment_notes ?? ""}
                placeholder="Short update the patient can read in their portal."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Save delivery details
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Totals</h2>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatPrice(order.total_cents, order.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1 capitalize">Current: {order.status.replace(/_/g, " ")}</p>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Delivery</h2>
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

        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Line items</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {order.items.map((line) => (
              <li key={line.id} className="py-2 flex justify-between gap-4 text-sm">
                <span>
                  {line.product_name_snapshot}{" "}
                  <span className="text-gray-500">×{line.quantity}</span>
                  <span className="block text-xs font-mono text-gray-400">{line.sku_snapshot}</span>
                </span>
                <span className="tabular-nums shrink-0">{formatPrice(line.line_total_cents, order.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
