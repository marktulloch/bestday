import Link from "next/link";

import type { ProductWithCategory } from "@/lib/products/queries";
import { formatPrice } from "@/lib/products/format-price";
import { primaryProductImageUrl } from "@/lib/products/image-urls";
import { productAccessHint } from "@/lib/products/visibility-labels";

type Variant = "marketing" | "portal";

export function ProductCard({
  product,
  href,
  variant,
}: {
  product: ProductWithCategory;
  href: string;
  variant: Variant;
}) {
  const categoryName = product.category?.name;
  const hint = variant === "portal" ? productAccessHint(product) : null;
  const imageUrl = primaryProductImageUrl(product);

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border-subtle bg-white overflow-hidden shadow-sm transition hover:border-brand-primary/40 hover:shadow-md"
    >
      {imageUrl ? (
        <div className="relative aspect-[16/10] w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary CDN URLs */}
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-col p-5 flex-1">
      {categoryName ? (
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{categoryName}</p>
      ) : null}
      <h3 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-[#0d2e0d]">
        {product.name}
      </h3>
      {product.short_description ? (
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{product.short_description}</p>
      ) : null}
      <div className="mt-auto pt-4 flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(product.price_cents, product.currency)}
        </p>
        <span className="text-sm font-medium text-[#4EDD00] group-hover:underline">View details</span>
      </div>
      {hint ? <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">{hint}</p> : null}
      {variant === "marketing" ? (
        <p className="mt-2 text-xs text-gray-500">
          Information only — not medical advice. A clinician assesses suitability.
        </p>
      ) : null}
      </div>
    </Link>
  );
}
