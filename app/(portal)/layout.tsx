import Link from "next/link";

import { SignOutButton } from "@/app/components/auth/SignOutButton";
import { PortalNav } from "@/app/components/portal/PortalNav";
import { requireAuth } from "@/lib/auth/guards-server";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 min-h-14 md:min-h-16 py-2 md:py-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4 sm:justify-start sm:gap-6">
            <Link href="/portal" className="text-sm font-semibold text-gray-900 shrink-0">
              My Best Day
            </Link>
            <PortalNav />
          </div>
          <div className="flex items-center justify-end gap-4 text-sm text-gray-600 border-t border-gray-100 pt-2 sm:border-0 sm:pt-0">
            <Link href="/" className="hover:text-gray-900">
              Website
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
