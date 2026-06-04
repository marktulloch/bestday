import {
  formatDecisionLogForAdmin,
  labelReasonCode,
  parseDecisionLogFromDb,
} from "@/lib/prescreen/eligibility";
import { getRecentPrescreensForStaff } from "@/lib/portal/prescreen-staff-data";

export default async function PrescreenStaffQueue() {
  const rows = await getRecentPrescreensForStaff(30);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-600 mt-8 border-t border-gray-200 pt-8">
        No pre-screen submissions in the recent queue.
      </p>
    );
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Pre-screen decisions</h2>
      <p className="text-sm text-gray-600 mb-4 max-w-2xl">
        Rule engine output, reason codes, and internal decision log (staff only). Customers only see
        high-level status in the portal.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Submitted</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Admin summary</th>
              <th className="px-3 py-2 font-medium">Reason codes</th>
              <th className="px-3 py-2 font-medium">Decision log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const lines = formatDecisionLogForAdmin(parseDecisionLogFromDb(row.decision_log));
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString("en-NZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.workflow_status}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-xs">
                    {row.decision_summary_admin ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {row.decision_reason_codes.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="list-disc list-inside space-y-0.5">
                        {row.decision_reason_codes.map((c) => (
                          <li key={c}>{labelReasonCode(c)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 max-w-md">
                    {lines.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                        {lines.map((line, i) => (
                          <li key={`${row.id}-log-${i}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
