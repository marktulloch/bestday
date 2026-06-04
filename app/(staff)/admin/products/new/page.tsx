import Link from "next/link";

import { AdminProductEditor } from "@/app/components/products/AdminProductEditor";
import { getAdminCategories } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <Link href="/admin/products" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">New product</h1>
      <p className="mt-1 text-sm text-gray-600 mb-8">
        Draft products are staff-only until status is active and visibility rules are set.
      </p>
      <AdminProductEditor categories={categories} />
    </div>
  );
}
