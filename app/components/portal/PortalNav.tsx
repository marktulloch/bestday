"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/products", label: "Products" },
  { href: "/portal/cart", label: "Order" },
  { href: "/portal/orders", label: "History" },
  { href: "/portal/tickets", label: "Support" },
  { href: "/portal/booking", label: "Booking" },
  { href: "/portal/profile", label: "Profile" },
] as const;

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== "/portal" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-[#E8FBE0] text-[#0d2e0d]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
