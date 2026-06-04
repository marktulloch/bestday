"use client";

import Link from "next/link";
import { isDemoMode } from "@/lib/demo-mode";

/**
 * Clear paths: pre-screen (new / in-progress) vs portal login (returning patients).
 * Matches header labels for consistency.
 */
export default function HeroButtons() {
  return (
    <div className="space-y-3">
      <div>
        <Link
          href="/prescreen"
          className="flex w-full flex-col items-stretch rounded-lg bg-[#4EDD00] px-5 py-3.5 text-left text-[#0d2e0d] transition-colors hover:bg-[#3db800] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4EDD00] focus-visible:ring-offset-2"
        >
          <span className="text-sm font-semibold tracking-tight">Start pre-screening</span>
          <span className="mt-0.5 text-xs font-normal text-[#0d2e0d]/80">
            New to Best Day or haven&apos;t finished — about 5 minutes
          </span>
        </Link>
      </div>

      <div>
        {isDemoMode ? (
          // Demo mode: backend portal link temporarily disabled
          <div
            aria-disabled="true"
            className="flex w-full cursor-default flex-col items-stretch rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-left text-gray-800"
          >
            <span className="text-sm font-semibold tracking-tight text-gray-900">Log in to patient portal</span>
            <span className="mt-0.5 text-xs font-normal text-gray-500">
              Returning patients — bookings, orders & messages
            </span>
          </div>
        ) : (
          <Link
            href="/login?next=/portal"
            className="flex w-full flex-col items-stretch rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-left text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
          >
            <span className="text-sm font-semibold tracking-tight text-gray-900">Log in to patient portal</span>
            <span className="mt-0.5 text-xs font-normal text-gray-500">
              Returning patients — bookings, orders & messages
            </span>
          </Link>
        )}
      </div>

      <p className="pt-1 text-center text-xs text-gray-500">
        <Link href="/how-it-works" className="font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline">
          How it works
        </Link>
        <span className="mx-1.5 text-gray-300" aria-hidden>
          ·
        </span>
        <Link href="/pricing" className="font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline">
          Pricing
        </Link>
      </p>
    </div>
  );
}
