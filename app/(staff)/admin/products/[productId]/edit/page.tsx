import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminProductEditor } from "@/app/components/products/AdminProductEditor";
import { getAdminCategories, getAdminProductById } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductById(productId),
    getAdminCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <Link href="/admin/products" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Edit product</h1>
      <p className="mt-1 text-sm text-gray-600 mb-8">
        SKU: <span className="font-mono">{product.sku}</span>
      </p>
      <AdminProductEditor categories={categories} product={product} />
    </div>
  );
}
