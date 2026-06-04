import Link from "next/link";

import { deleteProduct } from "@/app/(staff)/admin/products/actions";
import { formatPrice } from "@/lib/products/format-price";
import { primaryProductImageUrl } from "@/lib/products/image-urls";
import { getAdminProducts } from "@/lib/products/queries";
import { portalVisibilityLabel } from "@/lib/products/visibility-labels";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product catalogue</h1>
          <p className="mt-1 text-sm text-gray-600">
            SKUs, pricing, portal visibility, and educational listings. Inventory fields are ready for
            later fulfilment work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-[#4EDD00] px-4 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
          >
            New product
          </Link>
          <Link
            href="/admin/products/categories"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Categories
          </Link>
          <Link
            href="/admin/products/approvals"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Patient access
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium w-14" aria-label="Image" />
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Portal</th>
              <th className="px-4 py-3 font-medium">Public edu</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium w-40" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No products yet.{" "}
                  <Link href="/admin/products/new" className="text-[#4EDD00] font-medium hover:underline">
                    Create one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const thumb = primaryProductImageUrl(p);
                return (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-2 w-14">
                    {thumb ? (
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.catalogue_status}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px]">
                    {portalVisibilityLabel(p.portal_visibility)}
                  </td>
                  <td className="px-4 py-3">{p.public_education ? "Yes" : "—"}</td>
                  <td className="px-4 py-3 text-gray-800">{formatPrice(p.price_cents, p.currency)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-[#4EDD00] font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteProduct} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-red-600 font-medium hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
