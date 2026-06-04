import { notFound } from "next/navigation";

import { AdminPurchaseOrderDetail } from "@/app/components/admin/AdminPurchaseOrderDetail";
import { getPurchaseOrderForAdmin } from "@/lib/orders/purchase-queries";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getPurchaseOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <AdminPurchaseOrderDetail order={order} listHref="/admin/orders" listLabel="All orders" />
    </div>
  );
}
