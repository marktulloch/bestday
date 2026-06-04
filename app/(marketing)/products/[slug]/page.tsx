import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/app/components/products/ProductDetail";
import Section from "@/app/components/layout/Section";
import { getEducationalProductBySlug } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getEducationalProductBySlug(slug);
  if (!product) notFound();

  return (
    <Section>
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-gray-900">
            Learn
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>
        <ProductDetail product={product} variant="marketing" />
        <p className="mt-12 text-center">
          <Link
            href="/prescreen"
            className="inline-flex items-center justify-center rounded-lg bg-[#4EDD00] px-6 py-3 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
          >
            Start pre-screening
          </Link>
        </p>
      </div>
    </Section>
  );
}
