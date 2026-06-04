import type { ProductWithCategory } from "@/lib/products/queries";
import { formatPrice } from "@/lib/products/format-price";
import { imageUrlsFromProductMetadata, primaryProductImageUrl } from "@/lib/products/image-urls";
import { portalVisibilityLabel, productAccessHint } from "@/lib/products/visibility-labels";

export function ProductDetail({
  product,
  variant,
}: {
  product: ProductWithCategory;
  variant: "marketing" | "portal";
}) {
  const categoryName = product.category?.name;
  const images = imageUrlsFromProductMetadata(product.metadata);
  const primaryImage = primaryProductImageUrl(product);

  return (
    <article className="max-w-3xl">
      {categoryName ? (
        <p className="text-sm font-medium text-[#4EDD00]">{categoryName}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight">{product.name}</h1>

      {primaryImage ? (
        <div className="mt-6 space-y-3">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary CDN URLs */}
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full max-h-[min(420px,50vh)] object-contain object-center"
            />
          </div>
          {images.length > 1 ? (
            <ul className="flex flex-wrap gap-2">
              {images.slice(1).map((url, i) => (
                <li key={`${url}-${i}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-16 w-16 overflow-hidden rounded-lg border border-border-subtle bg-gray-50 ring-offset-2 hover:ring-2 hover:ring-[#4EDD00]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="mt-2 text-lg text-gray-600">{product.short_description}</p>
      <p className="mt-4 text-2xl font-semibold text-gray-900">
        {formatPrice(product.price_cents, product.currency)}
      </p>

      {variant === "portal" ? (
        <div className="mt-4 rounded-lg bg-brand-yellowSoft border border-border-subtle px-4 py-3 text-sm text-gray-800">
          <p className="font-medium text-[#0d2e0d]">Your access</p>
          <p className="mt-1">{productAccessHint(product)}</p>
          <p className="mt-2 text-xs text-gray-600">{portalVisibilityLabel(product.portal_visibility)}</p>
          {product.requires_doctor_approval ? (
            <p className="mt-2 text-xs text-gray-600">
              This product may require confirmation from your prescriber before supply.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Educational information</p>
          <p className="mt-1 text-amber-900/90">
            This page explains options we may discuss in clinic. It does not replace personalised
            medical advice.
          </p>
        </div>
      )}

      {product.description ? (
        <div className="mt-8">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
        </div>
      ) : null}

      {(product.dosage_form || product.strength || product.usage_instructions) && (
        <section className="mt-10 rounded-xl border border-border-subtle bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Dosage &amp; use</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {product.dosage_form ? (
              <div>
                <dt className="font-medium text-gray-500">Form</dt>
                <dd className="text-gray-900">{product.dosage_form}</dd>
              </div>
            ) : null}
            {product.strength ? (
              <div>
                <dt className="font-medium text-gray-500">Strength / concentration</dt>
                <dd className="text-gray-900">{product.strength}</dd>
              </div>
            ) : null}
            {product.usage_instructions ? (
              <div>
                <dt className="font-medium text-gray-500">Typical use</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">{product.usage_instructions}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      )}

      <footer className="mt-10 text-xs text-gray-500">
        <p>SKU: {product.sku}</p>
        {product.track_inventory && product.stock_quantity != null ? (
          <p className="mt-1">Stock tracking is enabled for this SKU (fulfilment integration pending).</p>
        ) : null}
      </footer>
    </article>
  );
}
