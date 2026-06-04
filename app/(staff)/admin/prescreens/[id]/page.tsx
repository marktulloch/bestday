import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatDecisionLogForAdmin,
  labelReasonCode,
  parseDecisionLogFromDb,
} from "@/lib/prescreen/eligibility";
import { getPrescreenForAdmin } from "@/lib/admin/prescreens-queries";
import { formatPrescreenPayloadSummary } from "@/lib/doctor/prescreen-summary";

export const dynamic = "force-dynamic";

export default async function AdminPrescreenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getPrescreenForAdmin(id);
  if (!row) notFound();

  const lines = formatDecisionLogForAdmin(parseDecisionLogFromDb(row.decision_log));
  const payloadLines = formatPrescreenPayloadSummary(row.payload);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link href="/admin/prescreens" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Prescreens
      </Link>

      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{row.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Pre-screen detail</h1>
        <p className="mt-2 text-sm text-gray-600">
          Workflow: <span className="font-medium text-gray-900">{row.workflow_status.replace(/_/g, " ")}</span>
          {row.user_id ? (
            <>
              {" "}
              · User <span className="font-mono text-xs">{row.user_id}</span>
            </>
          ) : null}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Created {new Date(row.created_at).toLocaleString("en-NZ")} · v{row.version}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Answers (summary)</h2>
          <ul className="mt-3 text-sm text-gray-700 space-y-1 list-disc list-inside">
            {payloadLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Admin summary</h2>
          <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{row.decision_summary_admin ?? "—"}</p>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-6">Reason codes</h3>
          <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-0.5">
            {row.decision_reason_codes.length === 0 ? (
              <li>—</li>
            ) : (
              row.decision_reason_codes.map((c) => <li key={c}>{labelReasonCode(c)}</li>)
            )}
          </ul>
        </section>

        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Decision log</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">—</p>
          ) : (
            <ul className="mt-2 text-xs font-mono text-gray-700 list-disc list-inside space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
