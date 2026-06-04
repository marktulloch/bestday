"use client";

import { useActionState } from "react";

import { updateCustomerOrderStatus } from "@/app/(staff)/doctor/actions";
import type { CustomerOrderRow } from "@/lib/database.types";

function OrderActionForm({
  customerId,
  orderId,
  status,
  label,
  variant,
}: {
  customerId: string;
  orderId: string;
  status: "approved" | "rejected" | "cancelled";
  label: string;
  variant: "primary" | "danger" | "muted";
}) {
  const [state, formAction, pending] = useActionState(updateCustomerOrderStatus, { ok: false });

  const cls =
    variant === "primary"
      ? "bg-[#4EDD00] text-[#0d2e0d] hover:bg-[#3bc200]"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-700"
        : "border border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`}
      >
        {pending ? "…" : label}
      </button>
      {state.error ? (
        <span className="ml-2 text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}

export function OrderStatusButtons({
  customerId,
  order,
}: {
  customerId: string;
  order: CustomerOrderRow;
}) {
  if (order.status !== "pending_review") {
    return (
      <span className="text-xs font-medium capitalize text-slate-600">{order.status.replace("_", " ")}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <OrderActionForm
        customerId={customerId}
        orderId={order.id}
        status="approved"
        label="Approve"
        variant="primary"
      />
      <OrderActionForm
        customerId={customerId}
        orderId={order.id}
        status="rejected"
        label="Reject"
        variant="danger"
      />
      <OrderActionForm
        customerId={customerId}
        orderId={order.id}
        status="cancelled"
        label="Cancel"
        variant="muted"
      />
    </div>
  );
}
