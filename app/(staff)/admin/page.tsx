import Link from "next/link";

import NotificationsStaffTable from "@/app/components/staff/NotificationsStaffTable";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { listAppointmentsForAdmin } from "@/lib/admin/bookings-queries";
import { listPrescreensForAdmin } from "@/lib/admin/prescreens-queries";

export default async function AdminHomePage() {
  const [metrics, recentPrescreens, upcomingAppts] = await Promise.all([
    getAdminDashboardMetrics(),
    listPrescreensForAdmin({ limit: 10 }),
    listAppointmentsForAdmin({ upcoming: true, limit: 10 }),
  ]);

  const metricCards = [
    {
      label: "New prescreens",
      hint: "Submitted or needs review",
      value: metrics.newPrescreens,
      href: "/admin/prescreens?queue=review",
    },
    {
      label: "Eligible for booking",
      value: metrics.eligibleForBooking,
      href: "/admin/prescreens?workflow=eligible_for_booking",
    },
    {
      label: "Upcoming appointments",
      value: metrics.upcomingAppointments,
      href: "/admin/bookings?upcoming=1",
    },
    {
      label: "Pending orders",
      hint: "Through dispatch",
      value: metrics.pendingOrders,
      href: "/admin/orders?pending=1",
    },
    {
      label: "Open tickets",
      value: metrics.openTickets,
      href: "/admin/tickets?view=open",
    },
  ] as const;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 max-w-2xl">
          Operational overview. Use the sidebar for full searchable lists, filters, and detail pages.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metricCards.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
            >
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{m.value}</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{m.label}</p>
              {"hint" in m && m.hint ? <p className="text-xs text-gray-500 mt-0.5">{m.hint}</p> : null}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 mb-10">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h2 className="text-sm font-semibold text-gray-900">Recent prescreens</h2>
            <Link href="/admin/prescreens" className="text-xs font-medium text-[#4EDD00] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPrescreens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      No prescreens yet.
                    </td>
                  </tr>
                ) : (
                  recentPrescreens.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("en-NZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-2 text-gray-900">{r.workflow_status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/prescreens/${r.id}`}
                          className="text-[#4EDD00] font-medium hover:underline text-xs"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h2 className="text-sm font-semibold text-gray-900">Next appointments</h2>
            <Link href="/admin/bookings?upcoming=1" className="text-xs font-medium text-[#4EDD00] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 font-medium">Start</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingAppts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      No upcoming appointments.
                    </td>
                  </tr>
                ) : (
                  upcomingAppts.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                        {new Date(a.start_time ?? 0).toLocaleString("en-NZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: a.timezone || undefined,
                        })}
                      </td>
                      <td className="px-4 py-2 text-gray-900 capitalize">{a.status.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/bookings/${a.id}`}
                          className="text-[#4EDD00] font-medium hover:underline text-xs"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <NotificationsStaffTable />
    </div>
  );
}
