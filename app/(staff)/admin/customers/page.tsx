import Link from "next/link";

import { AdminOpsExportControls } from "@/app/components/staff/AdminOpsExportControls";
import { listCustomersForAdmin } from "@/lib/admin/customers-queries";
import type { CustomerStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<CustomerStatus | "all">(["all", "draft", "active", "archived"]);

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";
  const statusRaw = sp.status as string | undefined;
  const status: CustomerStatus | "all" =
    statusRaw && STATUSES.has(statusRaw as CustomerStatus | "all")
      ? (statusRaw as CustomerStatus | "all")
      : "all";

  const rows = await listCustomersForAdmin({
    search: q.length > 0 ? q : null,
    status,
    limit: 100,
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Patient records linked to portal accounts. Search by name or email.
          </p>
        </div>
        <AdminOpsExportControls
          kind="customers"
          params={{
            ...(q ? { q } : {}),
            ...(status !== "all" ? { status } : {}),
          }}
        />
      </header>

      <form method="get" className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Since</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No customers match.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {c.profile?.full_name || c.profile?.email || "—"}
                    </span>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{c.id}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{c.status}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("en-NZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="text-[#4EDD00] font-medium hover:underline">
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
