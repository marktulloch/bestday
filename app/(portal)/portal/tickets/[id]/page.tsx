import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CustomerTicketReplyForm } from "@/app/components/portal/CustomerTicketReplyForm";
import { getAuthContext } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/purchase-queries";
import {
  getTicketByIdForCustomer,
  listCommentsForTicketCustomer,
} from "@/lib/tickets/queries";
import { ticketCategoryLabel, ticketStatusLabel } from "@/lib/tickets/labels";

export const dynamic = "force-dynamic";

export default async function PortalTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/portal/tickets");
  if (ctx.profile.role !== "customer") redirect("/admin/tickets");

  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) redirect("/portal");

  const { id } = await params;
  const ticket = await getTicketByIdForCustomer(customerId, id);
  if (!ticket) notFound();

  const comments = await listCommentsForTicketCustomer(id);

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link href="/portal/tickets" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Support
      </Link>

      <header className="mt-4 border-b border-gray-100 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {ticketStatusLabel(ticket.status)} · {ticketCategoryLabel(ticket.category)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Updated {new Date(ticket.updated_at).toLocaleString("en-NZ")}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Conversation</h2>
        <ul className="mt-4 space-y-4">
          {comments.length === 0 ? (
            <li className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-6 text-center">
              No replies yet. Our team will post updates here.
            </li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex justify-between gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-800">
                    {c.author_user_id === ctx.user.id ? "You" : "Best Day team"}
                  </span>
                  <span>{new Date(c.created_at).toLocaleString("en-NZ")}</span>
                </div>
                <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              </li>
            ))
          )}
        </ul>

        {ticket.status === "closed" || ticket.status === "resolved" ? (
          <p className="mt-6 text-sm text-gray-600">
            This conversation is marked {ticketStatusLabel(ticket.status).toLowerCase()}. If you need more
            help, open a new request from the support list.
          </p>
        ) : (
          <CustomerTicketReplyForm ticketId={ticket.id} />
        )}
      </section>
    </div>
  );
}
