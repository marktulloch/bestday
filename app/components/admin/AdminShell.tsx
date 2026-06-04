import type { ReactNode } from "react";

import { AdminSidebar } from "@/app/components/admin/AdminSidebar";

export function AdminShell({
  userLabel,
  children,
}: {
  userLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-gray-900">
      <AdminSidebar userLabel={userLabel} />
      <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
    </div>
  );
}
