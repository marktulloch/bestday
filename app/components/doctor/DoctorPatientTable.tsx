import Link from "next/link";

import type { DoctorPatientListRow } from "@/lib/doctor/patient-directory";

export function DoctorPatientTable({
  patients,
  filter,
}: {
  patients: DoctorPatientListRow[];
  filter: "all" | "assigned";
}) {
  const rows =
    filter === "assigned" ? patients.filter((p) => p.assignedToMe) : patients;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center text-sm text-slate-600">
        {filter === "assigned"
          ? "No patients assigned to you yet. Use “Add to my list” on a patient record, or view all patients."
          : "No patient records found."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assigned</th>
            <th className="px-4 py-3 font-medium w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900">
                {p.profile?.full_name || "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">{p.profile?.email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600 capitalize">{p.status}</td>
              <td className="px-4 py-3">
                {p.assignedToMe ? (
                  <span className="inline-flex items-center rounded-full bg-[#E8FBE0] px-2.5 py-0.5 text-xs font-medium text-[#0d2e0d]">
                    You
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/doctor/patients/${p.id}`}
                  className="font-medium text-[#3a9e00] hover:text-[#2d7d00] hover:underline"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
