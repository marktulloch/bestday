"use client";

import { useActionState } from "react";

import { confirmPurchasePlaceholderPayment } from "@/app/(portal)/portal/purchase/actions";

export function PlaceholderPayForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(confirmPurchasePlaceholderPayment, { ok: false });

  return (
    <form action={formAction} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm text-gray-800">
        <span className="font-medium">Test payment</span> — confirms your order so fulfilment can proceed.
        Replace this step with Stripe when ready.
      </p>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-800">Payment recorded. Thank you.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Processing…" : "Confirm payment (placeholder)"}
      </button>
    </form>
  );
}
