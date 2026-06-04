"use client";

import { useActionState, useState } from "react";

import { createCustomerSupportTicket } from "@/app/(portal)/portal/tickets/actions";
import type { PurchaseOrderSummary } from "@/lib/orders/purchase-queries";
import { formatPrice } from "@/lib/products/format-price";

export function CustomerNewTicketForm({ orders }: { orders: PurchaseOrderSummary[] }) {
  const [state, formAction, pending] = useActionState(createCustomerSupportTicket, { ok: true as const });
  const [category, setCategory] = useState("customer_support");

  const needsOrder = category === "order_issue" || category === "delivery_issue";

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {state && "ok" in state && state.ok === false && "error" in state && state.error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-gray-800">Topic</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="customer_support">General support</option>
          <option value="booking_support">Booking help</option>
          <option value="order_issue">Order issue</option>
          <option value="delivery_issue">Delivery issue</option>
        </select>
      </label>

      {needsOrder ? (
        orders.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            You don&apos;t have a submitted order yet. Choose a different topic, or place an order first.
          </p>
        ) : (
          <label className="block text-sm">
            <span className="font-medium text-gray-800">Related order</span>
            <select
              name="purchaseOrderId"
              required={needsOrder}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select an order
              </option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.placed_at
                    ? new Date(o.placed_at).toLocaleDateString("en-NZ")
                    : "Order"}{" "}
                  · {formatPrice(o.total_cents, o.currency)} · {o.status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        )
      ) : (
        <input type="hidden" name="purchaseOrderId" value="" />
      )}

      <label className="block text-sm">
        <span className="font-medium text-gray-800">Subject</span>
        <input
          name="subject"
          required
          minLength={3}
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Short summary"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-gray-800">Message</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={8000}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Describe what you need help with."
        />
      </label>

      <button
        type="submit"
        disabled={pending || (needsOrder && orders.length === 0)}
        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Open ticket"}
      </button>
    </form>
  );
}
