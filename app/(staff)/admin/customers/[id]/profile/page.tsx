import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CustomerProfile360Client } from "@/app/components/profile/CustomerProfile360Client";
import { getAuthContext } from "@/lib/auth/session";
import { loadCustomerProfile360 } from "@/lib/profile/load-customer-profile-360";

export const dynamic = "force-dynamic";

export default async function AdminCustomerProfile360Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=" + encodeURIComponent(`/admin/customers/${id}/profile`));
  }

  const model = await loadCustomerProfile360({
    customerId: id,
    viewerUserId: ctx.user.id,
    role: ctx.profile.role,
  });
  if (!model) notFound();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link href={`/admin/customers/${id}`} className="text-sm font-medium text-[#4EDD00] hover:underline">
        ← Customer record
      </Link>
      <div className="mt-6">
        <CustomerProfile360Client model={model} editRecordHref={`/admin/customers/${id}`} />
      </div>
    </div>
  );
}
