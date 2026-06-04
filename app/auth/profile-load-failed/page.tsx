import Link from "next/link";

import { SignOutButton } from "@/app/components/auth/SignOutButton";

/**
 * Signed in, but loading `profiles` failed with a database error (not “no row”).
 * Kept separate from account-incomplete so operators do not confuse RLS/schema faults with missing seed data.
 */
export default function ProfileLoadFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-950">
        <h1 className="text-lg font-semibold text-red-950 mb-2">Could not load your profile</h1>
        <p className="text-red-900/90 mb-4 leading-relaxed">
          You are signed in, but the database returned an error when reading your profile. This is
          usually temporary, or indicates a schema/RLS issue on the Supabase project. Try again in a
          moment; if it persists, apply the latest migrations and check the Supabase logs.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <SignOutButton />
          <Link href="/" className="text-sm font-medium text-[#0d2e0d] underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
