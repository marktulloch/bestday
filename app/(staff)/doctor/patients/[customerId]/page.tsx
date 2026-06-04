import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsultationNoteForm } from "@/app/components/doctor/ConsultationNoteForm";
import { CustomerOrderForm } from "@/app/components/doctor/CustomerOrderForm";
import { OrderStatusButtons } from "@/app/components/doctor/OrderStatusButtons";
import { PatientAssignmentToggle } from "@/app/components/doctor/PatientAssignmentToggle";
import { CustomerProductApprovalForm } from "@/app/components/doctor/CustomerProductApprovalForm";
import { RecommendationForm } from "@/app/components/doctor/RecommendationForm";
import { requireDoctorWorkspace } from "@/lib/auth/doctor-guard";
import { formatPrescreenPayloadSummary } from "@/lib/doctor/prescreen-summary";
import { getDoctorPatientDetail } from "@/lib/doctor/patient-detail";
import { getActiveProductsForStaff } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

const outcomeLabels: Record<string, string> = {
  follow_up: "Follow-up recommended",
  monitoring: "Monitoring / watchful",
  refer_external: "Refer externally",
  care_complete: "Care episode complete",
  other: "Other",
};

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { userId } = await requireDoctorWorkspace({ forbiddenRedirect: "/portal" });
  const [detail, catalogueProducts] = await Promise.all([
    getDoctorPatientDetail(customerId, userId),
    getActiveProductsForStaff(),
  ]);
  if (!detail) notFound();

  const displayName = detail.profile?.full_name || "Patient";
  const appointmentOptions = detail.appointments.map((a) => ({
    id: a.id,
    label: `${new Date(a.start_time ?? 0).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })} · ${a.status}`,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/doctor"
              className="text-sm font-medium text-[#3a9e00] hover:text-[#2d7d00] hover:underline"
            >
              ← Patients
            </Link>
            <Link
              href={`/doctor/patients/${customerId}/profile`}
              className="text-sm font-medium text-slate-600 hover:text-[#3a9e00] hover:underline"
            >
              360 profile
            </Link>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{detail.profile?.email ?? "—"}</p>
          <p className="mt-2 text-xs text-slate-500">
            Customer · <span className="font-mono">{detail.customer.id}</span> · Status:{" "}
            <span className="capitalize">{detail.customer.status}</span>
          </p>
        </div>
        <PatientAssignmentToggle
          customerId={detail.customer.id}
          assignedToMe={detail.assignedToMe}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Prescreen & eligibility" className="lg:col-span-2">
          {detail.prescreens.length === 0 && detail.mcPrescreeningResponses.length === 0 ? (
            <p className="text-sm text-slate-600">No prescreen submissions on file.</p>
          ) : (
            <div className="space-y-6">
              {detail.prescreens.map((ps, i) => {
                const summary = detail.prescreenSummaries[i];
                const extras = detail.eligibilityExtras[i];
                const payloadLines = formatPrescreenPayloadSummary(ps.payload);
                return (
                  <div
                    key={ps.id}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {summary?.label ?? "Prescreen"}
                      </p>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {ps.workflow_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {summary?.detail ? (
                      <p className="text-sm text-slate-700">{summary.detail}</p>
                    ) : null}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Form summary</p>
                      <ul className="text-sm text-slate-700 space-y-0.5 list-disc list-inside">
                        {payloadLines.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    {extras?.decision_summary_admin ? (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          Eligibility (internal)
                        </p>
                        <p className="text-sm text-slate-800">{extras.decision_summary_admin}</p>
                      </div>
                    ) : null}
                    {extras?.reason_codes?.length ? (
                      <p className="text-xs text-slate-600">
                        Reason codes: {extras.reason_codes.join(", ")}
                      </p>
                    ) : null}
                    {extras?.decision_log_lines?.length ? (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Decision log</p>
                        <ul className="text-xs text-slate-600 font-mono space-y-0.5">
                          {extras.decision_log_lines.map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-400">
                      Submitted {new Date(ps.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })}
              {detail.mcPrescreeningResponses.map((row, i) => {
                const lines = detail.mcPrescreeningAnswerLines[i] ?? [];
                return (
                  <div
                    key={row.id}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Medicinal cannabis questionnaire
                      </p>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {row.eligible ? "Eligible" : "Not eligible"}
                      </span>
                    </div>
                    {row.ineligible_reason ? (
                      <p className="text-sm text-slate-700">{row.ineligible_reason}</p>
                    ) : null}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Responses</p>
                      <ul className="text-sm text-slate-700 space-y-0.5 list-disc list-inside">
                        {lines.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-slate-400">
                      Submitted {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Bookings">
          {detail.appointments.length === 0 ? (
            <p className="text-sm text-slate-600">No appointments linked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {detail.appointments.map((a) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(a.start_time ?? 0).toLocaleString(undefined, {
                      weekday: "short",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-slate-600 capitalize mt-0.5">
                    {a.status.replace("_", " ")}
                    {a.timezone ? ` · ${a.timezone}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Support tickets">
          {detail.tickets.length === 0 ? (
            <p className="text-sm text-slate-600">No tickets for this customer.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {detail.tickets.map((t) => (
                <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/doctor/tickets/${t.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-[#4EDD00]"
                  >
                    {t.subject}
                  </Link>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t.status.replace(/_/g, " ")} · {t.priority} priority
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Product lines & approvals" className="lg:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3">Add line (pending review)</p>
              <CustomerOrderForm customerId={detail.customer.id} />
            </div>
            <div className="lg:col-span-2">
              {detail.orders.length === 0 ? (
                <p className="text-sm text-slate-600">No product lines yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.orders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-900">{o.product_name}</span>
                            {o.notes ? (
                              <p className="text-xs text-slate-500 mt-0.5">{o.notes}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 capitalize text-slate-700">
                            {o.status.replace("_", " ")}
                          </td>
                          <td className="px-3 py-2">
                            <OrderStatusButtons customerId={detail.customer.id} order={o} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Catalogue access (portal)" className="lg:col-span-2">
          <p className="text-xs text-slate-600 mb-3">
            Approve specific SKUs for patient portal visibility when products use “doctor-approved”
            rules.
          </p>
          <CustomerProductApprovalForm
            customerId={detail.customer.id}
            products={catalogueProducts}
          />
        </Card>

        <Card title="Consultation notes" className="lg:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ConsultationNoteForm
                customerId={detail.customer.id}
                appointments={appointmentOptions}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3">History</p>
              {detail.notes.length === 0 ? (
                <p className="text-sm text-slate-600">No notes yet.</p>
              ) : (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {detail.notes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm text-slate-800 whitespace-pre-wrap"
                    >
                      {n.body}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                        {n.appointment_id ? " · linked to appointment" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        <Card title="Recommendations & outcomes" className="lg:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <RecommendationForm customerId={detail.customer.id} />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-3">Recorded</p>
              {detail.recommendations.length === 0 ? (
                <p className="text-sm text-slate-600">None yet.</p>
              ) : (
                <ul className="space-y-3">
                  {detail.recommendations.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                      <p className="text-xs text-[#3a9e00] font-medium mt-1">
                        {outcomeLabels[r.outcome] ?? r.outcome}
                      </p>
                      {r.detail ? (
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                          {r.detail}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
