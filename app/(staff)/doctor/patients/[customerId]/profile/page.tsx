import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerProfile360Client } from "@/app/components/profile/CustomerProfile360Client";
import { requireDoctorWorkspace } from "@/lib/auth/doctor-guard";
import { loadCustomerProfile360 } from "@/lib/profile/load-customer-profile-360";

export const dynamic = "force-dynamic";

export default async function DoctorPatientProfile360Page({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { userId, role } = await requireDoctorWorkspace({ forbiddenRedirect: "/portal" });

  const model = await loadCustomerProfile360({
    customerId,
    viewerUserId: userId,
    role,
  });
  if (!model) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <Link
        href={`/doctor/patients/${customerId}`}
        className="text-sm font-medium text-[#3a9e00] hover:text-[#2d7d00] hover:underline"
      >
        ← Clinical workspace
      </Link>
      <div className="mt-6">
        <CustomerProfile360Client
          model={model}
          workspaceHref={`/doctor/patients/${customerId}`}
        />
      </div>
    </div>
  );
}
