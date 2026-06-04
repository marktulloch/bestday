import Link from "next/link";

import type { TicketCategory, TicketStatus } from "@/lib/database.types";
import { ticketCategoryLabel, ticketStatusLabel } from "@/lib/tickets/labels";

const STATUSES: (TicketStatus | "all")[] = [
  "all",
  "new",
  "in_progress",
  "waiting_on_customer",
  "waiting_on_doctor",
  "resolved",
  "closed",
];

const CATEGORIES: (TicketCategory | "all")[] = [
  "all",
  "prescreen_case",
  "booking_support",
  "doctor_followup",
  "order_issue",
  "delivery_issue",
  "customer_support",
  "compliance_review",
];

const ASSIGNEE = ["all", "unassigned", "me"] as const;

export function AdminTicketFilters({
  basePath,
  current,
}: {
  basePath: string;
  current: { status: string; category: string; assignee: string; view?: string };
}) {
  function href(partial: Record<string, string>) {
    const next = { ...current, ...partial };
    const p = new URLSearchParams();
    if (next.status !== "all") p.set("status", next.status);
    if (next.category !== "all") p.set("category", next.category);
    if (next.assignee !== "all") p.set("assignee", next.assignee);
    if (next.view === "open") p.set("view", "open");
    const q = p.toString();
    return q ? `${basePath}?${q}` : basePath;
  }

  return (
    <div className="space-y-4 mb-8">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Scope</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={(() => {
              const p = new URLSearchParams();
              if (current.status !== "all") p.set("status", current.status);
              if (current.category !== "all") p.set("category", current.category);
              if (current.assignee !== "all") p.set("assignee", current.assignee);
              const q = p.toString();
              return q ? `${basePath}?${q}` : basePath;
            })()}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
              current.view !== "open"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            All tickets
          </Link>
          <Link
            href={`${basePath}?view=open`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
              current.view === "open"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            Open only
          </Link>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                current.status === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s === "all" ? "All" : ticketStatusLabel(s as TicketStatus)}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={href({ category: c })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                current.category === c
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {c === "all" ? "All" : ticketCategoryLabel(c as TicketCategory)}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assignee</p>
        <div className="flex flex-wrap gap-2">
          {ASSIGNEE.map((a) => (
            <Link
              key={a}
              href={href({ assignee: a })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                current.assignee === a
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {a === "all" ? "Anyone" : a === "unassigned" ? "Unassigned" : "Assigned to me"}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
