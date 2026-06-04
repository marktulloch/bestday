"use client";

import { useActionState } from "react";

import { createCategory } from "@/app/(staff)/admin/products/actions";

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none";

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(createCategory, { ok: false });

  return (
    <form action={formAction} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Add category</h2>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Name *</span>
        <input name="name" required className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Slug (optional)</span>
        <input name="slug" className={inputCls} placeholder="auto from name" />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Description</span>
        <textarea name="description" rows={2} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-gray-600">Sort order</span>
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" name="is_active" defaultChecked className="rounded border-gray-300" />
        <span>Active</span>
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-700">Category created.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add category"}
      </button>
    </form>
  );
}
