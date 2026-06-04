"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { createProduct, updateProduct } from "@/app/(staff)/admin/products/actions";
import type { ProductCategoryRow } from "@/lib/database.types";
import { imageUrlsFromProductMetadata } from "@/lib/products/image-urls";
import type { ProductWithCategory } from "@/lib/products/queries";

const labelCls = "block text-xs font-medium text-gray-600";
const inputClsBase =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none";
const inputCls = "mt-1 " + inputClsBase;
const checkCls = "rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]";

function initialImageUrlRows(product?: ProductWithCategory | null): string[] {
  if (!product) return [];
  const u = imageUrlsFromProductMetadata(product.metadata);
  return u.length > 0 ? [...u] : [];
}

export function AdminProductEditor({
  categories,
  product,
}: {
  categories: ProductCategoryRow[];
  product?: ProductWithCategory | null;
}) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const [imageRows, setImageRows] = useState(() => initialImageUrlRows(product));

  useEffect(() => {
    setImageRows(initialImageUrlRows(product));
  }, [product?.id]);

  const priceDollars = product ? (product.price_cents / 100).toFixed(2) : "";

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelCls}>Name *</span>
          <input name="name" required defaultValue={product?.name} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>SKU *</span>
          <input name="sku" required defaultValue={product?.sku} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Slug (optional)</span>
          <input name="slug" defaultValue={product?.slug} placeholder="auto from name" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Category</span>
        <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputCls}>
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {!c.is_active ? "(inactive)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelCls}>Short description</span>
        <input
          name="short_description"
          defaultValue={product?.short_description ?? ""}
          className={inputCls}
        />
      </label>

      <div className="block space-y-2">
        <span className={labelCls}>Product images</span>
        <p className="text-xs text-gray-500">
          Add absolute URLs (https recommended), one per field. The first image is shown on catalogue
          cards. Up to 20 images.
        </p>
        {imageRows.length === 0 ? (
          <p className="text-sm text-gray-500">No image URLs yet.</p>
        ) : (
          <div className="space-y-2">
            {imageRows.map((value, index) => (
              <div key={index} className="flex gap-2">
                <input
                  name="image_urls"
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setImageRows((prev) => prev.map((row, i) => (i === index ? v : row)));
                  }}
                  type="url"
                  placeholder="https://…"
                  className={inputClsBase + " flex-1"}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setImageRows((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove image URL"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="text-sm font-medium text-[#0d2e0d] underline decoration-[#4EDD00] underline-offset-2 hover:text-[#4EDD00] disabled:opacity-40 disabled:no-underline"
          onClick={() => setImageRows((prev) => [...prev, ""])}
          disabled={imageRows.length >= 20}
        >
          {imageRows.length === 0 ? "Add image URL" : "Add another image URL"}
        </button>
      </div>

      <label className="block">
        <span className={labelCls}>Full description</span>
        <textarea
          name="description"
          rows={6}
          defaultValue={product?.description ?? ""}
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Dosage form</span>
          <input name="dosage_form" defaultValue={product?.dosage_form ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Strength</span>
          <input name="strength" defaultValue={product?.strength ?? ""} className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Usage instructions</span>
        <textarea
          name="usage_instructions"
          rows={4}
          defaultValue={product?.usage_instructions ?? ""}
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelCls}>Price (dollars) *</span>
          <input
            name="price_dollars"
            type="number"
            required
            min={0}
            step="0.01"
            defaultValue={priceDollars || "0"}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Currency</span>
          <input name="currency" defaultValue={product?.currency ?? "NZD"} maxLength={3} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Catalogue status</span>
          <select
            name="catalogue_status"
            defaultValue={product?.catalogue_status ?? "draft"}
            className={inputCls}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Patient portal visibility</span>
        <select name="portal_visibility" defaultValue={product?.portal_visibility ?? "none"} className={inputCls}>
          <option value="none">Not in portal</option>
          <option value="eligible_only">Eligible patients only</option>
          <option value="approved_only">Doctor-approved only</option>
          <option value="eligible_or_approved">Eligible or approved</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="public_education"
            defaultChecked={product?.public_education}
            className={checkCls}
          />
          <span>Show on public (educational) catalogue</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="requires_doctor_approval"
            defaultChecked={product?.requires_doctor_approval}
            className={checkCls}
          />
          <span>Doctor approval recommended / required (messaging)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="track_inventory"
            defaultChecked={product?.track_inventory}
            className={checkCls}
          />
          <span>Track inventory (future fulfilment)</span>
        </label>
      </div>

      <label className="block max-w-xs">
        <span className={labelCls}>Stock quantity (optional)</span>
        <input
          name="stock_quantity"
          type="number"
          min={0}
          defaultValue={product?.stock_quantity ?? ""}
          placeholder="—"
          className={inputCls}
        />
      </label>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700">
          Saved.{" "}
          <Link href="/admin/products" className="font-medium underline">
            Back to list
          </Link>
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#4EDD00] px-5 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800] disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Update product" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
