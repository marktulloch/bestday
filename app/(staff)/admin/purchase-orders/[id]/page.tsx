import { redirect } from "next/navigation";

export default async function AdminPurchaseOrderIdRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/orders/${id}`);
}
