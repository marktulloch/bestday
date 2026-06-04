import Link from "next/link";

import { DoctorPatientTable } from "@/app/components/doctor/DoctorPatientTable";
import { requireDoctorWorkspace } from "@/lib/auth/doctor-guard";
import { getDoctorPatientDirectory } from "@/lib/doctor/patient-directory";

export const dynamic = "force-dynamic";

export default async function DoctorHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const { userId } = await requireDoctorWorkspace({ forbiddenRedirect: "/portal" });
  const patients = await getDoctorPatientDirectory(userId);
  const sp = (await searchParams) ?? {};
  const filter = sp.view === "assigned" ? "assigned" : "all";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
          Patients
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Review assigned patients or browse everyone with a customer record. Open a profile for
          prescreen context, bookings, clinical notes, and product approvals.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/doctor"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-[#4EDD00] text-[#0d2e0d] shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All patients
        </Link>
        <Link
          href="/doctor?view=assigned"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "assigned"
              ? "bg-[#4EDD00] text-[#0d2e0d] shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          My list
        </Link>
      </div>

      <DoctorPatientTable patients={patients} filter={filter} />
    </div>
  );
}
