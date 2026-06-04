import { getRecentAppointmentsForStaff } from "@/lib/portal/appointments-staff-data";

export default async function AppointmentsStaffTable() {
  const rows = await getRecentAppointmentsForStaff(50);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-600 mt-8 border-t border-gray-200 pt-8">
        No appointments in the database yet. Webhooks will create rows when patients book via Calendly.
      </p>
    );
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Appointments</h2>
      <p className="text-sm text-gray-600 mb-4 max-w-2xl">
        System of record synced from Calendly. Google Calendar references appear when Calendly provides
        them in the webhook payload.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Start (UTC stored)</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Google ref</th>
              <th className="px-3 py-2 font-medium">Calendly event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {new Date(row.start_time ?? 0).toLocaleString("en-NZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: row.timezone || undefined,
                  })}
                  {row.end_time ? (
                    <span className="block text-xs text-gray-500">
                      →{" "}
                      {new Date(row.end_time).toLocaleTimeString("en-NZ", {
                        timeStyle: "short",
                        timeZone: row.timezone || undefined,
                      })}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">{row.status}</td>
                <td className="px-3 py-2 text-gray-600 font-mono text-xs break-all max-w-[120px]">
                  {row.user_id ?? "—"}
                </td>
                <td className="px-3 py-2 text-gray-600 font-mono text-xs break-all max-w-[140px]">
                  {row.google_calendar_event_id ?? "—"}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {row.calendly_event_uri ? (
                    <a
                      href={row.calendly_event_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4EDD00] hover:underline break-all"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
