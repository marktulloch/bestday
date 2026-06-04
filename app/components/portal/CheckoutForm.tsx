"use client";

import { useActionState } from "react";
import Link from "next/link";

import { submitPurchaseCheckout } from "@/app/(portal)/portal/purchase/actions";

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(submitPurchaseCheckout, { ok: false });

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none";

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Recipient name *</span>
        <input name="recipientName" required autoComplete="name" className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Address line 1 *</span>
        <input name="line1" required autoComplete="address-line1" className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Address line 2</span>
        <input name="line2" autoComplete="address-line2" className={inputCls} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-600">City *</span>
          <input name="city" required autoComplete="address-level2" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-600">Region</span>
          <input name="region" autoComplete="address-level1" className={inputCls} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-600">Postcode *</span>
          <input name="postal" required autoComplete="postal-code" className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-gray-600">Country *</span>
          <input name="country" defaultValue="NZ" required autoComplete="country-name" className={inputCls} />
        </label>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok && state.orderId ? (
        <p className="text-sm text-emerald-800">
          Order submitted.{" "}
          <Link href={`/portal/orders/${state.orderId}`} className="font-medium underline">
            Continue to payment
          </Link>
          .
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#4EDD00] px-5 py-2.5 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800] disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit order"}
        </button>
        <Link href="/portal/cart" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50">
          Back
        </Link>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Payment is processed securely. For now we use a placeholder flow so your team can plug in Stripe
        without changing how orders are stored.
      </p>
    </form>
  );
}
