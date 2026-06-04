"use client";

import { useActionState } from "react";

import { addPurchaseLine } from "@/app/(portal)/portal/purchase/actions";

export function AddToCartForm({
  productId,
  revalidateSlug,
}: {
  productId: string;
  /** Optional: for granular revalidation */
  revalidateSlug?: string;
}) {
  const [state, formAction, pending] = useActionState(addPurchaseLine, { ok: false });

  return (
    <form action={formAction} className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <input type="hidden" name="productId" value={productId} />
      {revalidateSlug ? <input type="hidden" name="revalidateSlug" value={revalidateSlug} /> : null}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs font-medium text-gray-600 mb-1">Quantity</span>
          <select
            name="quantity"
            defaultValue={1}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#4EDD00] px-5 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800] disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add to order"}
        </button>
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-emerald-800">
          Added.{" "}
          <a href="/portal/cart" className="font-medium underline">
            View your order
          </a>
        </p>
      ) : null}
      <p className="text-xs text-gray-500">
        You can only add products your care team has made available to you. Orders are reviewed like a
        medical supply request, not instant checkout.
      </p>
    </form>
  );
}
