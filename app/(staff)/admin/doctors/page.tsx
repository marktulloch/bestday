import Link from "next/link";

import { listDoctorsForAdmin } from "@/lib/admin/doctors-queries";

export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";
  const rows = await listDoctorsForAdmin(q.length > 0 ? q : null);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Doctors</h1>
        <p className="mt-1 text-sm text-gray-600">
          Clinical profiles. Assignment counts reflect the optional &quot;my patients&quot; list.
        </p>
      </header>

      <form method="get" className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Since</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No doctors match.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.full_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{d.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("en-NZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/doctors/${d.id}`} className="text-[#4EDD00] font-medium hover:underline text-xs">
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
