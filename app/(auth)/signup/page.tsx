import Link from "next/link";
import { cookies } from "next/headers";

import { BD_MC_PRESCREEN_STATUS_COOKIE } from "@/lib/mc-flow/cookies";

import { SignUpExperience } from "./SignUpExperience";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-medium mb-2">Supabase is not configured</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#0d2e0d] underline">
          Return home
        </Link>
      </div>
    );
  }

  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/portal";

  const jar = await cookies();
  const mcPrescreenCookieStatus = jar.get(BD_MC_PRESCREEN_STATUS_COOKIE)?.value ?? null;

  return (
    <div className="w-full max-w-lg">
      <SignUpExperience nextPath={nextPath} mcPrescreenCookieStatus={mcPrescreenCookieStatus} />
    </div>
  );
}
