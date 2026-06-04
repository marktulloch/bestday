import Link from "next/link";

import { AdminOpsExportControls } from "@/app/components/staff/AdminOpsExportControls";
import { listAppointmentsForAdmin } from "@/lib/admin/bookings-queries";
import type { AppointmentStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUSES: (AppointmentStatus | "all")[] = [
  "all",
  "scheduled",
  "rescheduled",
  "cancelled",
  "completed",
  "no_show",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ upcoming?: string; status?: string; user?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const upcoming = sp.upcoming === "1";
  const statusRaw = sp.status ?? "all";
  const status: AppointmentStatus | "all" = STATUSES.includes(statusRaw as AppointmentStatus | "all")
    ? (statusRaw as AppointmentStatus | "all")
    : "all";
  const userSearch = sp.user?.trim() ?? "";

  const rows = await listAppointmentsForAdmin({
    upcoming,
    status,
    searchUserId: userSearch.length > 0 ? userSearch : null,
    limit: 120,
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Calendly-synced appointments. Filter by horizon and status.
          </p>
        </div>
        <AdminOpsExportControls
          kind="appointments"
          params={{
            ...(upcoming ? { upcoming: "1" } : {}),
            ...(status !== "all" ? { status } : {}),
            ...(userSearch ? { user: userSearch } : {}),
          }}
        />
      </header>

      <form method="get" className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              !upcoming ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/bookings?upcoming=1"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              upcoming ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            Upcoming
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {upcoming ? <input type="hidden" name="upcoming" value="1" /> : null}
          <select name="status" defaultValue={status} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Any status" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            name="user"
            placeholder="Filter by user UUID…"
            defaultValue={userSearch}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Calendly</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No appointments match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                    {new Date(r.start_time ?? 0).toLocaleString("en-NZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: r.timezone || undefined,
                    })}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-900">{r.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[100px] truncate">
                    {r.user_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.calendly_event_uri ? (
                      <a
                        href={r.calendly_event_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4EDD00] text-xs hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${r.id}`} className="text-[#4EDD00] font-medium hover:underline text-xs">
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
