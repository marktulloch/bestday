import Link from "next/link";
import { notFound } from "next/navigation";

import { countDoctorPatientAssignments, getDoctorProfileForAdmin } from "@/lib/admin/doctors-queries";

export const dynamic = "force-dynamic";

export default async function AdminDoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getDoctorProfileForAdmin(id);
  if (!profile) notFound();

  const assignCount = await countDoctorPatientAssignments(id);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link href="/admin/doctors" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Doctors
      </Link>

      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{profile.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{profile.full_name || "Doctor"}</h1>
        <p className="text-sm text-gray-600 mt-1">{profile.email}</p>
        <p className="text-xs text-gray-500 mt-3">
          Assigned patient list: <span className="font-semibold text-gray-800">{assignCount}</span>{" "}
          (optional clinical queue)
        </p>
      </header>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
        <p>
          For clinical workflows, doctors use the{" "}
          <Link href="/doctor" className="text-[#4EDD00] font-medium hover:underline">
            doctor workspace
          </Link>
          . This page is for admin reference only.
        </p>
      </div>
    </div>
  );
}
