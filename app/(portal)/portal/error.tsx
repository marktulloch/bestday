"use client";

import Link from "next/link";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
        We couldn&apos;t load your portal dashboard. Your session may have expired, or there was a temporary problem.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2.5 rounded-lg bg-[#4EDD00] text-[#0d2e0d] text-sm font-medium hover:bg-[#3db800]"
        >
          Try again
        </button>
        <Link
          href="/login?next=/portal"
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign in again
        </Link>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <p className="mt-8 text-xs text-red-600 font-mono break-all max-w-lg mx-auto">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
