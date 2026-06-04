import { redirect } from "next/navigation";

export default function AdminPurchaseOrdersRedirectPage() {
  redirect("/admin/orders");
}
