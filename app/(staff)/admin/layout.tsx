import { AdminShell } from "@/app/components/admin/AdminShell";
import { SupabaseEnvMissing } from "@/app/components/staff/SupabaseEnvMissing";
import { getAuthContext } from "@/lib/auth/session";
import { isSupabasePublicConfigured, requireRoles } from "@/lib/auth/guards-server";

export const dynamic = "force-dynamic";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabasePublicConfigured()) {
    return <SupabaseEnvMissing area="admin" />;
  }

  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });
  const ctx = await getAuthContext();
  const userLabel = ctx?.profile.full_name?.trim() || ctx?.user.email || "Admin";

  return <AdminShell userLabel={userLabel}>{children}</AdminShell>;
}
