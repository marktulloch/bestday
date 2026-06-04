import Link from "next/link";
import { notFound } from "next/navigation";

import { adminUpdateCustomer } from "@/app/(staff)/admin/customers/actions";
import { getCustomerForAdmin, getCustomerRelatedForAdmin } from "@/lib/admin/customers-queries";
import { formatPrice } from "@/lib/products/format-price";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerForAdmin(id);
  if (!customer) notFound();

  const related = await getCustomerRelatedForAdmin(customer.id, customer.user_id);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin/customers" className="text-sm font-medium text-[#4EDD00] hover:underline">
          ← Customers
        </Link>
        <Link
          href={`/admin/customers/${customer.id}/profile`}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline"
        >
          360 profile
        </Link>
      </div>

      <header className="mt-4 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-500">{customer.id}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          {customer.profile?.full_name || customer.profile?.email || "Customer"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">{customer.profile?.email}</p>
        <p className="text-xs font-mono text-gray-400 mt-2">User {customer.user_id}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-5 h-fit">
          <h2 className="text-sm font-semibold text-gray-900">Record</h2>
          <form action={adminUpdateCustomer} className="mt-4 space-y-4">
            <input type="hidden" name="customerId" value={customer.id} />
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <select
                name="status"
                defaultValue={customer.status}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Phone</span>
              <input
                name="phone"
                type="text"
                defaultValue={customer.phone ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Region</span>
              <input
                name="region"
                type="text"
                defaultValue={customer.region ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Save
            </button>
          </form>
        </section>

        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Prescreens</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {related.prescreens.length === 0 ? (
                <li className="py-2 text-gray-500">None linked to this user.</li>
              ) : (
                related.prescreens.map((p) => (
                  <li key={p.id} className="py-2 flex justify-between gap-4">
                    <span className="text-gray-700">{p.workflow_status.replace(/_/g, " ")}</span>
                    <Link href={`/admin/prescreens/${p.id}`} className="text-[#4EDD00] text-xs font-medium hover:underline shrink-0">
                      Open
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">MC questionnaire</h2>
            <p className="mt-1 text-xs text-gray-500">
              Medicinal cannabis pre-screen (`prescreening_responses`), distinct from legacy prescreens.
            </p>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {related.mcQuestionnaires.length === 0 ? (
                <li className="py-2 text-gray-500">None on file.</li>
              ) : (
                related.mcQuestionnaires.map((m) => (
                  <li key={m.id} className="py-4 space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-700 font-medium">
                        {m.eligible ? "Eligible" : "Not eligible"}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(m.created_at).toLocaleString("en-NZ")}
                      </span>
                    </div>
                    {m.ineligible_reason ? (
                      <p className="text-xs text-gray-600">{m.ineligible_reason}</p>
                    ) : null}
                    <ul className="text-xs text-gray-700 list-disc list-inside space-y-0.5">
                      {m.summaryLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Bookings</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {related.appointments.length === 0 ? (
                <li className="py-2 text-gray-500">None.</li>
              ) : (
                related.appointments.map((a) => (
                  <li key={a.id} className="py-2 flex justify-between gap-4">
                    <span className="text-gray-700">
                      {new Date(a.start_time ?? 0).toLocaleString("en-NZ", { dateStyle: "short", timeStyle: "short" })}{" "}
                      · {a.status}
                    </span>
                    <Link href={`/admin/bookings/${a.id}`} className="text-[#4EDD00] text-xs font-medium hover:underline shrink-0">
                      Open
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Purchase orders</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {related.purchaseOrders.length === 0 ? (
                <li className="py-2 text-gray-500">None.</li>
              ) : (
                related.purchaseOrders.map((o) => (
                  <li key={o.id} className="py-2 flex justify-between gap-4">
                    <span className="text-gray-700">
                      {formatPrice(o.total_cents, o.currency)} · {o.status.replace(/_/g, " ")}
                    </span>
                    <Link href={`/admin/orders/${o.id}`} className="text-[#4EDD00] text-xs font-medium hover:underline shrink-0">
                      Open
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
