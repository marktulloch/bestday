import { DoctorSidebar } from "@/app/components/doctor/DoctorSidebar";
import { SupabaseEnvMissing } from "@/app/components/staff/SupabaseEnvMissing";
import { isSupabasePublicConfigured } from "@/lib/auth/guards-server";
import { requireDoctorWorkspace } from "@/lib/auth/doctor-guard";

export const dynamic = "force-dynamic";

export default async function DoctorSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabasePublicConfigured()) {
    return <SupabaseEnvMissing area="doctor" />;
  }

  const { role, displayName } = await requireDoctorWorkspace({
    forbiddenRedirect: "/portal",
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      <DoctorSidebar role={role} displayName={displayName} />
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
