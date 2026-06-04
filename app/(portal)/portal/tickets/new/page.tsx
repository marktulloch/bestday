import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomerNewTicketForm } from "@/app/components/portal/CustomerNewTicketForm";
import { getAuthContext } from "@/lib/auth/session";
import { getCustomerIdForUser, listSubmittedPurchaseOrdersForCustomer } from "@/lib/orders/purchase-queries";

export const dynamic = "force-dynamic";

export default async function PortalNewTicketPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/tickets/new");
  if (ctx.profile.role !== "customer") redirect("/admin/tickets");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  const orders = await listSubmittedPurchaseOrdersForCustomer(customerId);

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link href="/portal/tickets" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Support
      </Link>
      <header className="mt-4 border-b border-gray-100 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">New request</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl">
          Tell us what you need. Our team will respond here — you&apos;ll only see messages meant for you.
        </p>
      </header>

      <div className="mt-8">
        <CustomerNewTicketForm orders={orders} />
      </div>
    </div>
  );
}
