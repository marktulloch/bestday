import Link from "next/link";

import { ProductCard } from "@/app/components/products/ProductCard";
import Section from "@/app/components/layout/Section";
import { getEducationalProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function PublicProductsPage() {
  const products = await getEducationalProducts();

  return (
    <Section>
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Learn</span>
        </nav>
        <header className="max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
            Product information
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">
            Educational overviews of formats we may discuss in clinic. Availability and suitability are
            always confirmed by your clinician and depend on your care plan.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="text-sm text-gray-600 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center">
            Catalogue content is being updated. Please check back or start with{" "}
            <Link href="/prescreen" className="text-[#4EDD00] font-medium hover:underline">
              pre-screening
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} href={`/products/${p.slug}`} variant="marketing" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
