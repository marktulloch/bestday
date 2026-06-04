import { requireRoles } from "@/lib/auth/guards-server";

export const dynamic = "force-dynamic";

/**
 * Example customer-only shell (e.g. care pathways, orders when not staff).
 * Staff roles are redirected to the main portal dashboard.
 */
export default async function CustomerCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRoles(["customer"], { forbiddenRedirect: "/portal" });
  return <>{children}</>;
}
