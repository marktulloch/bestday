import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductCard } from "@/app/components/products/ProductCard";
import { getAuthContext } from "@/lib/auth/session";
import { getPortalProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function PortalProductsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/products");

  if (ctx.profile.role !== "customer") {
    redirect("/admin/products");
  }

  const products = await getPortalProducts();

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Your catalogue</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Products available to you depend on pre-screen eligibility and any approvals from your care
          team. This is not a checkout — your clinician confirms what you can access.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center text-sm text-gray-600">
          <p>No catalogue items match your account yet.</p>
          <p className="mt-2">
            Complete{" "}
            <Link href="/prescreen" className="text-[#4EDD00] font-medium hover:underline">
              pre-screening
            </Link>{" "}
            or speak with your prescriber if you expected to see products here.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} href={`/portal/products/${p.slug}`} variant="portal" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
