import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/purchase-queries";
import { listTicketsForCustomer } from "@/lib/tickets/queries";
import { ticketCategoryLabel, ticketStatusLabel } from "@/lib/tickets/labels";

export const dynamic = "force-dynamic";

export default async function PortalTicketsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/tickets");
  if (ctx.profile.role !== "customer") redirect("/admin/tickets");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  const tickets = await listTicketsForCustomer(customerId);

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Support</h1>
          <p className="mt-1 text-sm text-gray-600">
            Conversations with our team about bookings, orders, and your care.
          </p>
        </div>
        <Link
          href="/portal/tickets/new"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 shrink-0"
        >
          New request
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center">
          <p className="text-sm text-gray-600">You don&apos;t have any support tickets yet.</p>
          <Link href="/portal/tickets/new" className="mt-3 inline-block text-sm font-medium text-[#4EDD00] hover:underline">
            Start a conversation
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/portal/tickets/${t.id}`}
                className="block rounded-xl border border-gray-200 bg-white px-4 py-4 hover:border-gray-300 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{t.subject}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {ticketStatusLabel(t.status)} · {ticketCategoryLabel(t.category)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Updated {new Date(t.updated_at).toLocaleString("en-NZ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
