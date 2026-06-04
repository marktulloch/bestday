import Link from "next/link";
import { notFound } from "next/navigation";

import { getAppointmentForAdmin } from "@/lib/admin/bookings-queries";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAppointmentForAdmin(id);
  if (!a) notFound();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link href="/admin/bookings" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Bookings
      </Link>

      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{a.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Appointment</h1>
        <p className="mt-2 text-sm text-gray-600 capitalize">Status: {a.status.replace(/_/g, " ")}</p>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 text-sm">
          <h2 className="text-sm font-semibold text-gray-900">Schedule</h2>
          <dl className="mt-3 space-y-2 text-gray-700">
            <div>
              <dt className="text-xs text-gray-500">Start</dt>
              <dd>
                {new Date(a.start_time ?? 0).toLocaleString("en-NZ", {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: a.timezone || undefined,
                })}
              </dd>
            </div>
            {a.end_time ? (
              <div>
                <dt className="text-xs text-gray-500">End</dt>
                <dd>
                  {new Date(a.end_time).toLocaleString("en-NZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: a.timezone || undefined,
                  })}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-gray-500">Timezone</dt>
              <dd>{a.timezone ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 text-sm">
          <h2 className="text-sm font-semibold text-gray-900">References</h2>
          <dl className="mt-3 space-y-2 text-gray-700">
            <div>
              <dt className="text-xs text-gray-500">User</dt>
              <dd className="font-mono text-xs break-all">{a.user_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Customer</dt>
              <dd className="font-mono text-xs break-all">
                {a.customer_id ? (
                  <Link href={`/admin/customers/${a.customer_id}`} className="text-[#4EDD00] hover:underline">
                    {a.customer_id}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Prescreen</dt>
              <dd className="font-mono text-xs break-all">
                {a.prescreen_id ? (
                  <Link href={`/admin/prescreens/${a.prescreen_id}`} className="text-[#4EDD00] hover:underline">
                    {a.prescreen_id}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Calendly event</dt>
              <dd>
                {a.calendly_event_uri ? (
                  <a href={a.calendly_event_uri} className="text-[#4EDD00] hover:underline break-all" target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Google Calendar</dt>
              <dd className="font-mono text-xs break-all">{a.google_calendar_event_id ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
