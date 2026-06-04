import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveProductsForStaff, getAdminProductApprovals } from "@/lib/products/queries";

import { ApprovalUpsertForm } from "./ApprovalUpsertForm";

export const dynamic = "force-dynamic";

export default async function AdminProductApprovalsPage() {
  const [rows, products] = await Promise.all([getAdminProductApprovals(), getActiveProductsForStaff()]);

  const userIds = [...new Set(rows.map((r) => r.customer?.user_id).filter(Boolean))] as string[];
  const supabase = await createClient();
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <Link href="/admin/products" className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Patient product access</h1>
      <p className="mt-1 text-sm text-gray-600 mb-8">
        Doctor-approved SKUs for portal visibility rules (approved-only paths).
      </p>

      <div className="space-y-10">
        <ApprovalUpsertForm products={products} />
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white text-left text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2 font-medium">Patient</th>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No approval rows yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const uid = r.customer?.user_id;
                    const prof = uid ? profileById.get(uid) : undefined;
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-2">
                          <span className="font-medium text-gray-900">
                            {prof?.full_name || prof?.email || "—"}
                          </span>
                          <p className="text-xs font-mono text-gray-500">{r.customer_id}</p>
                        </td>
                        <td className="px-4 py-2">
                          {r.product?.name ?? "—"}
                          <p className="text-xs text-gray-500 font-mono">{r.product?.sku}</p>
                        </td>
                        <td className="px-4 py-2 capitalize">{r.status}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {new Date(r.updated_at).toLocaleString("en-NZ")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
