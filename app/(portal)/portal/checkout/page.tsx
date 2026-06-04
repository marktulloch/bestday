import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/app/components/portal/CheckoutForm";
import { getAuthContext } from "@/lib/auth/session";
import { mcPrescreenBlocksPortalCommerce } from "@/lib/mc-flow/commerce-gate";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { formatPrice } from "@/lib/products/format-price";
import { getCustomerIdForUser, getDraftOrderForCustomer } from "@/lib/orders/purchase-queries";

export const dynamic = "force-dynamic";

export default async function PortalCheckoutPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/checkout");
  if (ctx.profile.role !== "customer") {
    redirect("/portal");
  }

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  if (await mcPrescreenBlocksPortalCommerce(ctx.user.id)) {
    return (
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10">
        <h1 className="text-xl font-semibold text-gray-900">Checkout unavailable</h1>
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
  if (!draft || draft.items.length === 0) {
    redirect("/portal/cart");
  }

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link href="/portal/cart" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Back to order
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900 tracking-tight">Delivery details</h1>
      <p className="mt-1 text-sm text-gray-600 max-w-xl">
        We&apos;ll use this address for dispatch. A team member may contact you to confirm before sending.
      </p>
      <p className="mt-4 text-sm font-medium text-gray-900">
        Order total: {formatPrice(draft.total_cents, draft.currency)}
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
