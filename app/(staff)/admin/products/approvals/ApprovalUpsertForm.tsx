"use client";

import { useActionState } from "react";

import { upsertCustomerProductApproval } from "@/app/(staff)/admin/products/approval-actions";
import type { ProductRow } from "@/lib/database.types";

export function ApprovalUpsertForm({
  products,
}: {
  products: Pick<ProductRow, "id" | "name" | "sku">[];
}) {
  const [state, formAction, pending] = useActionState(upsertCustomerProductApproval, { ok: false });

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">Grant or update access</h2>
      <p className="text-xs text-gray-600">
        Use the patient&apos;s <span className="font-mono">customer_id</span> from their record (doctor
        patient page or database).
      </p>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Customer ID (UUID) *</span>
        <input name="customerId" required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono" />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Product *</span>
        <select name="productId" required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">— Select —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Status *</span>
        <select name="status" required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="revoked">Revoked</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Notes</span>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#4EDD00] px-4 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save access"}
      </button>
    </form>
  );
}
