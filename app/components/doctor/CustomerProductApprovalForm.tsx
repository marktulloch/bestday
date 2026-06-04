"use client";

import { useActionState } from "react";

import { upsertCustomerProductApproval } from "@/app/(staff)/admin/products/approval-actions";
import type { ProductRow } from "@/lib/database.types";

export function CustomerProductApprovalForm({
  customerId,
  products,
}: {
  customerId: string;
  products: Pick<ProductRow, "id" | "name" | "sku">[];
}) {
  const [state, formAction, pending] = useActionState(upsertCustomerProductApproval, { ok: false });

  if (products.length === 0) {
    return (
      <p className="text-sm text-slate-600">No active catalogue SKUs to attach. Add products in admin.</p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Product</span>
        <select
          name="productId"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        >
          <option value="">— Select —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Status</span>
        <select
          name="status"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="revoked">Revoked</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Notes (optional)</span>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        />
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#4EDD00] px-4 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3bc200] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update portal access"}
      </button>
    </form>
  );
}
