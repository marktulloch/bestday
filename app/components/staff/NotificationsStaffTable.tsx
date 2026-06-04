import { getRecentNotificationsForStaff } from "@/lib/portal/notifications-staff-data";

export default async function NotificationsStaffTable() {
  const rows = await getRecentNotificationsForStaff(120);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-600 mt-8 border-t border-gray-200 pt-8">
        No notification log entries yet. Booking confirmations and reminders appear after Calendly
        webhooks schedule jobs (and after the notification cron runs).
      </p>
    );
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Notification &amp; reminder log</h2>
      <p className="text-sm text-gray-600 mb-4 max-w-2xl">
        Email sends first; SMS rows will show as <span className="font-mono text-xs">skipped</span>{" "}
        until a provider is wired. Template key identifies which copy was used at schedule time.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Scheduled</th>
              <th className="px-3 py-2 font-medium">To</th>
              <th className="px-3 py-2 font-medium">Template</th>
              <th className="px-3 py-2 font-medium">Ch.</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Provider / error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                  {new Date(row.created_at).toLocaleString("en-NZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                  {new Date(row.scheduled_for).toLocaleString("en-NZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-3 py-2 text-gray-800 max-w-[140px] break-all text-xs">
                  {row.to_address}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-800">{row.template_key}</td>
                <td className="px-3 py-2 text-gray-600">{row.channel}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{row.status}</td>
                <td className="px-3 py-2 text-gray-600 text-xs max-w-[220px]">
                  {row.status === "sent" ? (
                    <span className="font-mono break-all">{row.provider_message_id ?? row.provider}</span>
                  ) : row.error_message ? (
                    <span className="text-red-700">{row.error_message}</span>
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
