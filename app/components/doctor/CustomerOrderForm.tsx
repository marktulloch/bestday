"use client";

import { useActionState } from "react";

import { createCustomerOrder } from "@/app/(staff)/doctor/actions";

export function CustomerOrderForm({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState(createCustomerOrder, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Product / item</span>
        <input
          name="productName"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
          placeholder="e.g. Product name or SKU"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Internal notes (optional)</span>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        />
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-700">Line added — pending approval.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add product line"}
      </button>
    </form>
  );
}
