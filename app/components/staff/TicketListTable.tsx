import Link from "next/link";

import type { TicketRow } from "@/lib/database.types";
import { ticketCategoryLabel, ticketStatusLabel } from "@/lib/tickets/labels";

export function TicketListTable({
  tickets,
  detailHref,
}: {
  tickets: TicketRow[];
  detailHref: (id: string) => string;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center text-sm text-gray-600">
        No tickets match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3">
                <Link href={detailHref(t.id)} className="font-medium text-gray-900 hover:text-[#4EDD00]">
                  {t.subject}
                </Link>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{t.id.slice(0, 8)}…</p>
              </td>
              <td className="px-4 py-3 text-gray-700">{ticketStatusLabel(t.status)}</td>
              <td className="px-4 py-3 text-gray-600">{ticketCategoryLabel(t.category)}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {new Date(t.updated_at).toLocaleString("en-NZ", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
