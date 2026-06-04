import Link from "next/link";

import { AdminOpsExportControls } from "@/app/components/staff/AdminOpsExportControls";
import { listPrescreensForAdmin } from "@/lib/admin/prescreens-queries";
import type { PrescreenWorkflowStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const WORKFLOWS: (PrescreenWorkflowStatus | "all")[] = [
  "all",
  "draft",
  "submitted",
  "eligible_for_booking",
  "needs_manual_review",
  "ineligible",
];

export default async function AdminPrescreensPage({
  searchParams,
}: {
  searchParams?: Promise<{ queue?: string; workflow?: string; id?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const queue = sp.queue === "review" ? "review" : null;
  const workflowRaw = sp.workflow ?? "all";
  const workflow: PrescreenWorkflowStatus | "all" = WORKFLOWS.includes(workflowRaw as PrescreenWorkflowStatus | "all")
    ? (workflowRaw as PrescreenWorkflowStatus | "all")
    : "all";
  const searchId = sp.id?.trim() ?? "";

  const rows = await listPrescreensForAdmin({
    queue,
    workflow: queue ? "all" : workflow,
    searchId: searchId.length > 0 ? searchId : null,
    limit: 150,
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prescreens</h1>
          <p className="mt-1 text-sm text-gray-600">
            Questionnaire submissions and eligibility outcomes. Filter by workflow or jump to a UUID.
          </p>
        </div>
        <AdminOpsExportControls
          kind="prescreens"
          params={{
            ...(queue ? { queue: "review" } : {}),
            ...(!queue && workflow !== "all" ? { workflow } : {}),
            ...(searchId ? { id: searchId } : {}),
          }}
        />
      </header>

      <form method="get" className="flex flex-col gap-3 mb-6">
        {queue === "review" ? <input type="hidden" name="queue" value="review" /> : null}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/prescreens"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              !queue && workflow === "all" && !searchId
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            All recent
          </Link>
          <Link
            href="/admin/prescreens?queue=review"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              queue === "review"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            Needs review
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            name="workflow"
            defaultValue={queue ? "all" : workflow}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            disabled={Boolean(queue)}
          >
            {WORKFLOWS.map((w) => (
              <option key={w} value={w}>
                {w === "all" ? "Any workflow" : w.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            name="id"
            type="search"
            placeholder="Prescreen UUID…"
            defaultValue={searchId}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Summary</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No rows match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                    {new Date(r.created_at).toLocaleString("en-NZ")}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{r.workflow_status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-md truncate">
                    {r.decision_summary_admin ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/prescreens/${r.id}`} className="text-[#4EDD00] font-medium hover:underline text-xs">
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
