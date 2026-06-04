import Link from "next/link";
import { redirect } from "next/navigation";

import { removePurchaseLine, updatePurchaseLineQuantity } from "@/app/(portal)/portal/purchase/actions";
import { getAuthContext } from "@/lib/auth/session";
import { mcPrescreenBlocksPortalCommerce } from "@/lib/mc-flow/commerce-gate";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { formatPrice } from "@/lib/products/format-price";
import { getCustomerIdForUser, getDraftOrderForCustomer } from "@/lib/orders/purchase-queries";

export const dynamic = "force-dynamic";

export default async function PortalCartPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/cart");
  if (ctx.profile.role !== "customer") redirect("/admin/orders");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) {
    return (
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10">
        <p className="text-sm text-gray-600">We could not find a patient record for your account.</p>
      </div>
    );
  }

  if (await mcPrescreenBlocksPortalCommerce(ctx.user.id)) {
    return (
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Orders unavailable</h1>
        <p className="mt-3 text-sm text-gray-600 max-w-xl leading-relaxed">{MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE}</p>
        <p className="mt-4 text-sm text-gray-600">
          <a href="/portal" className="font-medium text-[#4EDD00] hover:underline">
            Return to portal
          </a>
        </p>
      </div>
    );
  }

  const draft = await getDraftOrderForCustomer(customerId);

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Your current order</h1>
      <p className="mt-1 text-sm text-gray-600 max-w-xl">
        Review items before delivery details and payment. Nothing is final until you complete checkout.
      </p>

      {!draft || draft.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center">
          <p className="text-sm text-gray-600">No items yet.</p>
          <Link
            href="/portal/products"
            className="mt-4 inline-block text-sm font-medium text-[#4EDD00] hover:underline"
          >
            Browse your catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {draft.items.map((line) => (
              <li key={line.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{line.product_name_snapshot}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{line.sku_snapshot}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(line.unit_price_cents, draft.currency)} each
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <form action={updatePurchaseLineQuantity} className="flex items-center gap-2 text-sm">
                    <input type="hidden" name="lineId" value={line.id} />
                    <label className="text-gray-600">Qty</label>
                    <select
                      name="quantity"
                      defaultValue={line.quantity}
                      className="rounded-lg border border-gray-200 px-2 py-1.5"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs font-medium text-[#4EDD00] hover:underline">
                      Update
                    </button>
                  </form>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatPrice(line.line_total_cents, draft.currency)}
                  </p>
                  <form action={removePurchaseLine}>
                    <input type="hidden" name="lineId" value={line.id} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100 pt-6">
            <p className="text-lg font-semibold text-gray-900">
              Total {formatPrice(draft.total_cents, draft.currency)}
            </p>
            <Link
              href="/portal/checkout"
              className="inline-flex justify-center rounded-lg bg-[#4EDD00] px-6 py-3 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
            >
              Delivery &amp; checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
