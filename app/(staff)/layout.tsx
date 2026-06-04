import Link from "next/link";

import { SignOutButton } from "@/app/components/auth/SignOutButton";

export const dynamic = "force-dynamic";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-[1120px] mx-auto px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-900">Best Day — Staff</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
            <Link href="/doctor" className="text-gray-600 hover:text-gray-900">
              Doctor
            </Link>
            <Link href="/portal" className="text-gray-600 hover:text-gray-900">
              Portal
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
