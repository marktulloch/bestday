import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomerProfile360Client } from "@/app/components/profile/CustomerProfile360Client";
import { getAuthContext } from "@/lib/auth/session";
import { loadCustomerProfile360ForCurrentUser } from "@/lib/profile/load-customer-profile-360";

export const dynamic = "force-dynamic";

export default async function PortalProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/portal/profile");
  }

  const { profile, user } = ctx;
  if (profile.role !== "customer") {
    if (profile.role === "doctor") redirect("/doctor");
    if (profile.role === "admin" || profile.role === "master") redirect("/admin");
    redirect("/portal");
  }

  const model = await loadCustomerProfile360ForCurrentUser({
    viewerUserId: user.id,
    role: "customer",
  });

  if (!model) {
    return (
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
        <Link
          href="/portal"
          className="text-sm font-medium text-[#4EDD00] hover:underline mb-6 inline-block"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Profile</h1>
        <p className="text-sm text-gray-600">
          We couldn&apos;t find a patient record linked to this account yet. Complete onboarding or contact
          support if this persists.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Link
        href="/portal"
        className="text-sm font-medium text-[#4EDD00] hover:underline mb-6 inline-block"
      >
        ← Back to dashboard
      </Link>
      <p className="text-sm text-gray-600 mb-6">
        Your care and order activity in one place. Some details are only visible to your clinical team.
      </p>
      <CustomerProfile360Client model={model} />
    </div>
  );
}
