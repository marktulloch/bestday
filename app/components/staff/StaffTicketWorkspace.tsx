import Link from "next/link";

import { staffAddTicketComment, staffUpdateTicket } from "@/lib/tickets/staff-actions";
import { ticketCategoryLabel, ticketStatusLabel } from "@/lib/tickets/labels";
import type { StaffProfileOption } from "@/lib/tickets/queries";
import type { TicketCommentRow, TicketRow } from "@/lib/database.types";

function authorLabel(
  id: string,
  map: Map<string, { email: string | null; full_name: string | null }>,
): string {
  const p = map.get(id);
  return p?.full_name || p?.email || id.slice(0, 8);
}

export function StaffTicketWorkspace({
  ticket,
  comments,
  assignees,
  authorProfiles,
  assigneeProfile,
  listHref,
  listLabel,
  isAdminContext = true,
}: {
  ticket: TicketRow;
  comments: TicketCommentRow[];
  assignees: StaffProfileOption[];
  authorProfiles: Map<string, { email: string | null; full_name: string | null }>;
  assigneeProfile: { email: string | null; full_name: string | null } | null;
  listHref: string;
  listLabel: string;
  /** Doctors may not use /admin purchase order routes. */
  isAdminContext?: boolean;
}) {
  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <Link href={listHref} className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← {listLabel}
      </Link>

      <header className="mt-4 border-b border-gray-200 pb-6">
        <p className="text-xs font-mono text-gray-500">{ticket.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{ticket.subject}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-800">
            {ticketStatusLabel(ticket.status)}
          </span>
          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 border border-gray-200">
            {ticketCategoryLabel(ticket.category)}
          </span>
          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600 border border-gray-200 capitalize">
            {ticket.priority} priority
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Assigned:{" "}
          <span className="font-medium text-gray-900">
            {ticket.assigned_to_user_id
              ? assigneeProfile
                ? assigneeProfile.full_name || assigneeProfile.email || "Team member"
                : "Team member"
              : "Unassigned"}
          </span>
        </p>
        {ticket.purchase_order_id ? (
          <p className="mt-2 text-sm">
            {isAdminContext ? (
              <Link
                href={`/admin/orders/${ticket.purchase_order_id}`}
                className="text-[#4EDD00] font-medium hover:underline"
              >
                Linked purchase order
              </Link>
            ) : (
              <span className="text-gray-600">
                Linked order <span className="font-mono text-xs">{ticket.purchase_order_id.slice(0, 8)}…</span>
              </span>
            )}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gray-500">
          Updated {new Date(ticket.updated_at).toLocaleString("en-NZ")}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Thread</h2>
          <ul className="space-y-4">
            {comments.length === 0 ? (
              <li className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                No messages yet.
              </li>
            ) : (
              comments.map((c) => (
                <li
                  key={c.id}
                  className={
                    "rounded-xl border p-4 " +
                    (c.visibility === "internal"
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-gray-200 bg-white")
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-800">
                      {authorLabel(c.author_user_id, authorProfiles)}
                    </span>
                    <span>
                      {c.visibility === "internal" ? (
                        <span className="text-amber-800 font-medium">Internal</span>
                      ) : (
                        <span>Customer-visible</span>
                      )}{" "}
                      · {new Date(c.created_at).toLocaleString("en-NZ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                </li>
              ))
            )}
          </ul>

          <form action={staffAddTicketComment} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <h3 className="text-sm font-semibold text-gray-900">Add reply</h3>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Visibility</span>
              <select
                name="visibility"
                defaultValue="internal"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="internal">Internal note (hidden from patient)</option>
                <option value="external">Reply to patient (visible in portal)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Message</span>
              <textarea
                name="body"
                required
                rows={5}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Your update…"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Post
            </button>
          </form>
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Case settings</h2>
          <form action={staffUpdateTicket} className="mt-4 rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <select
                name="status"
                defaultValue={ticket.status}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {(
                  [
                    "new",
                    "in_progress",
                    "waiting_on_customer",
                    "waiting_on_doctor",
                    "resolved",
                    "closed",
                  ] as const
                ).map((s) => (
                  <option key={s} value={s}>
                    {ticketStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Category</span>
              <select
                name="category"
                defaultValue={ticket.category}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {(
                  [
                    "prescreen_case",
                    "booking_support",
                    "doctor_followup",
                    "order_issue",
                    "delivery_issue",
                    "customer_support",
                    "compliance_review",
                  ] as const
                ).map((c) => (
                  <option key={c} value={c}>
                    {ticketCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Priority</span>
              <select
                name="priority"
                defaultValue={ticket.priority}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize"
              >
                {(["low", "normal", "high", "urgent"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Assign to</span>
              <select
                name="assignedToUserId"
                defaultValue={ticket.assigned_to_user_id ?? "unassigned"}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="unassigned">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {(a.full_name || a.email || a.id).slice(0, 48)} ({a.role})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Save changes
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
