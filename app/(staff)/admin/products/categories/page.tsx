import Link from "next/link";

import { getAdminCategories } from "@/lib/products/queries";

import { CategoryCreateForm } from "./CategoryCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminProductCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <Link href="/admin/products" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Categories</h1>
      <p className="mt-1 text-sm text-gray-600 mb-8">Group catalogue items for public and portal views.</p>

      <div className="grid gap-10 lg:grid-cols-2">
        <CategoryCreateForm />
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">All categories</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <li className="px-4 py-8 text-sm text-gray-500 text-center">No categories yet.</li>
            ) : (
              categories.map((c) => (
                <li key={c.id} className="px-4 py-3 flex justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{c.slug}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">
                    {c.is_active ? "Active" : "Inactive"} · sort {c.sort_order}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
