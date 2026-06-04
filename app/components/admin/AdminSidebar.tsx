"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/app/components/auth/SignOutButton";

const NAV: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/prescreens", label: "Prescreens" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/doctors", label: "Doctors" },
];

function linkClass(active: boolean) {
  return active
    ? "bg-[#E8FBE0] text-[#0d2e0d] font-semibold"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white md:min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Operations</p>
        <p className="text-lg font-semibold text-gray-900 mt-0.5">Best Day</p>
        <p className="text-xs text-gray-600 mt-1 truncate" title={userLabel}>
          {userLabel}
        </p>
      </div>
      <nav className="flex md:flex-col gap-0.5 p-2 overflow-x-auto md:overflow-visible">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${linkClass(isActivePath(pathname, href))}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Website
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
