import { Suspense } from "react";

import { DashboardSkeleton } from "@/app/components/portal/DashboardSkeleton";

import PortalDashboard from "./PortalDashboard";

export const dynamic = "force-dynamic";

export default function PortalHomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PortalDashboard />
    </Suspense>
  );
}
