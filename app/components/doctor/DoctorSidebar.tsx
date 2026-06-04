import Link from "next/link";

import { SignOutButton } from "@/app/components/auth/SignOutButton";
import type { AppRole } from "@/lib/auth/roles";
import { canSeeAdminNav } from "@/lib/auth/doctor-guard";

const nav = [
  { href: "/doctor", label: "Patients" },
  { href: "/doctor/tickets", label: "Tickets" },
] as const;

export function DoctorSidebar({
  role,
  displayName,
}: {
  role: AppRole;
  displayName: string | null;
}) {
  const showAdmin = canSeeAdminNav(role);

  return (
    <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white md:min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clinical</p>
        <p className="text-lg font-semibold text-slate-900 mt-0.5">Best Day</p>
        <p className="text-xs text-slate-600 mt-1 truncate" title={displayName ?? undefined}>
          {displayName || "Staff"}
        </p>
      </div>
      <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-visible">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-[#E8FBE0] hover:text-[#0d2e0d] whitespace-nowrap"
          >
            {label}
          </Link>
        ))}
        {showAdmin ? (
          <Link
            href="/admin"
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 whitespace-nowrap"
          >
            Admin tools
          </Link>
        ) : null}
      </nav>
      <div className="mt-auto p-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/" className="text-slate-600 hover:text-slate-900">
          Website
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
