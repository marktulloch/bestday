import Link from "next/link";

import { AdminOpsExportControls } from "@/app/components/staff/AdminOpsExportControls";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { PurchaseOrderRow } from "@/lib/database.types";
import { formatPrice } from "@/lib/products/format-price";
import { listAllPurchaseOrdersForAdmin } from "@/lib/orders/purchase-queries";

export const dynamic = "force-dynamic";

const PENDING = new Set([
  "awaiting_payment",
  "paid",
  "awaiting_fulfilment",
  "packed",
  "dispatched",
]);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ pending?: string; status?: string; id?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const pendingOnly = sp.pending === "1";
  const statusFilter = sp.status?.trim() ?? "";
  const idFilter = sp.id?.trim() ?? "";

  let orders = await listAllPurchaseOrdersForAdmin();

  if (pendingOnly) {
    orders = orders.filter((o) => PENDING.has(o.status));
  }
  if (statusFilter && statusFilter !== "all") {
    orders = orders.filter((o) => o.status === statusFilter);
  }
  if (/^[0-9a-f-]{36}$/i.test(idFilter)) {
    orders = orders.filter((o) => o.id === idFilter);
  }

  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const supabase = await createClient();
  const { data: customersRaw } =
    customerIds.length > 0
      ? await looseDb(supabase).from("customers").select("id, user_id").in("id", customerIds)
      : { data: [] as { id: string; user_id: string }[] };

  const customers = (customersRaw ?? []) as { id: string; user_id: string }[];
  const userIds = [...new Set(customers.map((c) => c.user_id))];
  const { data: profilesRaw } =
    userIds.length > 0
      ? await looseDb(supabase).from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

  const profiles = (profilesRaw ?? []) as { id: string; email: string | null; full_name: string | null }[];
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  function patientLabel(o: PurchaseOrderRow): string {
    const c = customerById.get(o.customer_id);
    if (!c) return o.customer_id.slice(0, 8);
    const p = profileById.get(c.user_id);
    return p?.full_name || p?.email || c.user_id.slice(0, 8);
  }

  const statusOptions = [
    "all",
    "draft",
    "awaiting_payment",
    "paid",
    "awaiting_fulfilment",
    "packed",
    "dispatched",
    "delivered",
    "cancelled",
  ] as const;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Patient checkout and fulfilment. Filter by pipeline state.
          </p>
        </div>
        <AdminOpsExportControls
          kind="orders"
          params={{
            ...(pendingOnly ? { pending: "1" } : {}),
            ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
            ...(idFilter ? { id: idFilter } : {}),
          }}
        />
      </header>

      <form method="get" className="flex flex-col gap-3 mb-6">
        {pendingOnly ? <input type="hidden" name="pending" value="1" /> : null}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              !pendingOnly ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/orders?pending=1"
            className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
              pendingOnly ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            Pending pipeline
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            name="status"
            defaultValue={statusFilter || "all"}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Any status" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            name="id"
            placeholder="Order UUID…"
            defaultValue={idFilter}
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
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Placed</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No orders match.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{patientLabel(o)}</span>
                    <p className="text-xs font-mono text-gray-500">{o.customer_id}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{o.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(o.total_cents, o.currency)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.placed_at ? new Date(o.placed_at).toLocaleString("en-NZ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#4EDD00] font-medium hover:underline">
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
