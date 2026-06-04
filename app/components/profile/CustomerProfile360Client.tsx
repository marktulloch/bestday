"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { CustomerProfile360ViewModel } from "@/lib/profile/types";

type TabId = "overview" | "care" | "commerce" | "support" | "library";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "care", label: "Care journey" },
  { id: "commerce", label: "Orders & products" },
  { id: "support", label: "Support" },
  { id: "library", label: "Documents & activity" },
];

function pill(
  active: boolean,
  vm: CustomerProfile360ViewModel,
  onClick: () => void,
  label: string,
) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
        active
          ? `${vm.visibility.viewer === "customer" ? "bg-[#4EDD00] border-[#4EDD00] text-gray-900" : "bg-gray-900 border-gray-900 text-white"}`
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function TimelineIcon({ icon }: { icon: string }) {
  const map: Record<string, string> = {
    prescreen: "PS",
    booking: "Bk",
    order: "Or",
    ticket: "Tk",
    note: "Nt",
    notification: "Em",
    document: "Dc",
    delivery: "Sh",
    product_line: "Pl",
    recommendation: "Rc",
  };
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
      {map[icon] ?? "•"}
    </span>
  );
}

export function CustomerProfile360Client({
  model,
  workspaceHref,
  editRecordHref,
}: {
  model: CustomerProfile360ViewModel;
  /** Doctor workspace (forms) or null */
  workspaceHref?: string | null;
  /** Admin customer record editor */
  editRecordHref?: string | null;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  const displayName = model.profile.full_name || model.profile.email || "Customer";

  const stats = useMemo(
    () => [
      {
        label: "Pre-screens",
        value: model.prescreens.length + model.mcQuestionnaires.length,
        tab: "care" as TabId,
      },
      { label: "Bookings", value: model.appointments.length, tab: "care" as TabId },
      { label: "Open tickets", value: model.tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length, tab: "support" as TabId },
      { label: "Orders", value: model.purchaseOrders.filter((o) => o.status !== "draft").length, tab: "commerce" as TabId },
    ],
    [model],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{displayName}</h1>
          {model.profile.email ? (
            <p className="text-sm text-gray-600 mt-1">{model.profile.email}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="capitalize">Status: {model.customer.status}</span>
            {model.visibility.showStaffIdentifiers ? (
              <span className="font-mono">· {model.customerId}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {editRecordHref ? (
            <Link
              href={editRecordHref}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Edit record
            </Link>
          ) : null}
          {workspaceHref ? (
            <Link
              href={workspaceHref}
              className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-white hover:opacity-95 ${
                model.visibility.viewer === "customer" ? "bg-[#4EDD00] text-gray-900" : "bg-gray-900"
              }`}
            >
              Clinical workspace
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        {TABS.map((t) => (
          <span key={t.id}>{pill(tab === t.id, model, () => setTab(t.id), t.label)}</span>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Personal details" className="lg:col-span-1">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</dt>
                <dd className="text-gray-900 mt-0.5">{model.customer.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Region</dt>
                <dd className="text-gray-900 mt-0.5">{model.customer.region || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member since</dt>
                <dd className="text-gray-900 mt-0.5">
                  {new Date(model.customer.created_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
            </dl>
          </SectionCard>
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {stats.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setTab(s.tab)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-gray-300 transition-colors"
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p
                  className={`text-2xl font-semibold mt-1 ${
                    model.visibility.viewer === "customer" ? "text-[#3a9e00]" : "text-gray-900"
                  }`}
                >
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-2">View section →</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "care" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Pre-screen status" className="lg:col-span-2">
            {model.prescreens.length === 0 && model.mcQuestionnaires.length === 0 ? (
              <p className="text-sm text-gray-600">No pre-screen submissions.</p>
            ) : (
              <ul className="space-y-4">
                {model.prescreens.map((p) => (
                  <li key={p.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{p.patientLabel}</p>
                      <span className="text-xs uppercase text-gray-500">
                        {p.workflow_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{p.patientDetail}</p>
                    {p.payloadSummaryLines?.length ? (
                      <ul className="mt-3 text-xs text-gray-600 list-disc list-inside space-y-0.5">
                        {p.payloadSummaryLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {p.decisionSummaryAdmin ? (
                      <p className="text-xs text-gray-700 mt-2 border-t border-gray-200 pt-2">
                        <span className="font-medium">Internal summary: </span>
                        {p.decisionSummaryAdmin}
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
                {model.mcQuestionnaires.map((m) => (
                  <li key={m.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">Medicinal cannabis questionnaire</p>
                      <span className="text-xs uppercase text-gray-500">
                        {m.eligible ? "Eligible" : "Not eligible"}
                      </span>
                    </div>
                    {m.ineligible_reason ? (
                      <p className="text-sm text-gray-700 mt-1">{m.ineligible_reason}</p>
                    ) : null}
                    {m.summaryLines.length ? (
                      <ul className="mt-3 text-xs text-gray-600 list-disc list-inside space-y-0.5">
                        {m.summaryLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Bookings">
            {model.appointments.length === 0 ? (
              <p className="text-sm text-gray-600">No appointments.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {model.appointments.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0">
                    {model.linkContext === "admin" ? (
                      <Link href={`/admin/bookings/${a.id}`} className="font-medium text-gray-900 hover:underline">
                        {new Date(a.start_time ?? 0).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {new Date(a.start_time ?? 0).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                    <p className="text-xs text-gray-600 capitalize mt-0.5">
                      {a.status.replace(/_/g, " ")}
                      {a.timezone ? ` · ${a.timezone}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Consultation notes summary">
            {!model.visibility.showConsultationNotes ? (
              <p className="text-sm text-gray-600">
                Clinical notes stay in your care record. If your team shares a summary with you, it will
                appear here in a future update.
              </p>
            ) : model.consultationNotes.length === 0 ? (
              <p className="text-sm text-gray-600">No consultation notes yet.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {model.consultationNotes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {n.body}
                    <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recommendations" className="lg:col-span-2">
            {!model.visibility.showRecommendations ? (
              <p className="text-sm text-gray-600">Recommendations are visible to your clinical team.</p>
            ) : model.recommendations.length === 0 ? (
              <p className="text-sm text-gray-600">None recorded.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {model.recommendations.map((r) => (
                  <li key={r.id} className="rounded-lg border border-gray-100 p-3">
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    <p className="text-xs text-emerald-700 font-medium mt-1 capitalize">
                      {r.outcome.replace(/_/g, " ")}
                    </p>
                    {r.detail ? (
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.detail}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "commerce" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Product lines (clinical)" className="lg:col-span-2">
            {model.customerOrders.length === 0 ? (
              <p className="text-sm text-gray-600">No product lines.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {model.customerOrders.map((o) => (
                  <li key={o.id} className="py-2 flex justify-between gap-4 text-sm">
                    <span className="font-medium text-gray-900">{o.product_name}</span>
                    <span className="text-gray-600 capitalize">{o.status.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Approved catalogue products" className="lg:col-span-2">
            {model.productApprovals.length === 0 ? (
              <p className="text-sm text-gray-600">No per-product approvals.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {model.productApprovals.map((a) => (
                  <li key={a.id} className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-900">{a.product_name}</span>
                    <span className="text-gray-600 capitalize">{a.status}</span>
                    {a.product_slug && model.linkContext === "portal" ? (
                      <Link href={`/portal/products/${a.product_slug}`} className="text-xs text-[#4EDD00] hover:underline w-full">
                        View in catalogue
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Purchase orders" className="lg:col-span-2">
            {model.purchaseOrders.length === 0 ? (
              <p className="text-sm text-gray-600">No orders.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                      <th className="px-3 py-2 font-medium">Delivery</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {model.purchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td className="px-3 py-2 text-gray-700">
                          {(po.placed_at ? new Date(po.placed_at) : new Date(po.created_at)).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 capitalize">{po.status.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2">
                          {(po.total_cents / 100).toFixed(2)} {po.currency}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {po.delivery_status
                            ? po.delivery_status.replace(/_/g, " ")
                            : "—"}
                          {po.tracking_number ? (
                            <span className="block text-xs font-mono mt-0.5">{po.tracking_number}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={
                              model.linkContext === "portal"
                                ? `/portal/orders/${po.id}`
                                : `/admin/orders/${po.id}`
                            }
                            className={`text-xs font-medium hover:underline ${
                              model.visibility.viewer === "customer"
                                ? "text-[#4EDD00]"
                                : "text-emerald-700"
                            }`}
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "support" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Tickets">
            {model.tickets.length === 0 ? (
              <p className="text-sm text-gray-600">No tickets.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {model.tickets.map((t) => (
                  <li key={t.id} className="py-3">
                    <Link
                      href={
                        model.linkContext === "portal"
                          ? `/portal/tickets/${t.id}`
                          : model.linkContext === "doctor"
                            ? `/doctor/tickets/${t.id}`
                            : `/admin/tickets/${t.id}`
                      }
                      className="text-sm font-medium text-gray-900 hover:text-[#4EDD00]"
                    >
                      {t.subject}
                    </Link>
                    <p className="text-xs text-gray-600 mt-0.5 capitalize">
                      {t.status.replace(/_/g, " ")} · {t.priority} · {t.category.replace(/_/g, " ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Notification history summary">
            {model.notifications.length === 0 ? (
              <p className="text-sm text-gray-600">No notification log entries.</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
                {model.notifications.map((n) => (
                  <li key={n.id} className="py-3 text-sm">
                    <p className="font-medium text-gray-900">{n.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {n.template_key.replace(/_/g, " ")} · {n.status}
                      {n.sent_at
                        ? ` · sent ${new Date(n.sent_at).toLocaleString()}`
                        : ` · scheduled ${new Date(n.scheduled_for).toLocaleString()}`}
                    </p>
                    {n.bodyPreview ? (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-3">{n.bodyPreview}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "library" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Documents">
            {model.documents.length === 0 ? (
              <p className="text-sm text-gray-600">
                No documents linked yet. Your team can attach files or links to your record.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {model.documents.map((d) => (
                  <li key={d.id} className="py-3 text-sm flex flex-col gap-1">
                    <span className="font-medium text-gray-900">{d.title}</span>
                    <span className="text-xs text-gray-500 capitalize">{d.kind}</span>
                    {d.external_url ? (
                      <a
                        href={d.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#4EDD00] hover:underline break-all"
                      >
                        Open link
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Activity timeline">
            {model.timeline.length === 0 ? (
              <p className="text-sm text-gray-600">No events yet.</p>
            ) : (
              <ul className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {model.timeline.map((e, idx) => (
                  <li key={`${e.sortKey}-${idx}`} className="flex gap-3">
                    <TimelineIcon icon={e.icon} />
                    <div className="min-w-0">
                      {e.href ? (
                        <Link href={e.href} className="text-sm font-medium text-gray-900 hover:text-[#4EDD00]">
                          {e.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{e.title}</p>
                      )}
                      {e.subtitle ? <p className="text-xs text-gray-600 mt-0.5">{e.subtitle}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
