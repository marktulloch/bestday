import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AddToCartForm } from "@/app/components/portal/AddToCartForm";
import { ProductDetail } from "@/app/components/products/ProductDetail";
import { getAuthContext } from "@/lib/auth/session";
import { getPortalProductBySlug } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function PortalProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/products");

  if (ctx.profile.role !== "customer") {
    redirect("/admin/products");
  }

  const { slug } = await params;
  const product = await getPortalProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link href="/portal/products" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Catalogue
      </Link>
      <div className="mt-6">
        <ProductDetail product={product} variant="portal" />
        <AddToCartForm productId={product.id} revalidateSlug={slug} />
      </div>
    </div>
  );
}
