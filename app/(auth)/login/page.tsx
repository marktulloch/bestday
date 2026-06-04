import Link from "next/link";

import { PatientLoginExperience } from "@/app/components/auth/PatientLoginExperience";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    check_email?: string;
    error?: string;
    next?: string;
    from?: string;
  }>;
}) {
  const params = await searchParams;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-medium mb-2">Supabase is not configured</p>
        <p className="text-amber-900/90">
          Copy <code className="text-xs bg-white/80 px-1 rounded">.env.example</code> to{" "}
          <code className="text-xs bg-white/80 px-1 rounded">.env.local</code> and add your project URL and anon key.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#0d2e0d] underline">
          Return home
        </Link>
      </div>
    );
  }

  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/portal";

  return (
    <div className="w-full max-w-[420px]">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        Best Day
      </p>
      <PatientLoginExperience
        nextPath={nextPath}
        fromPrescreen={params.from === "prescreen"}
        magicCheckEmail={params.check_email === "1"}
        serverError={params.error ?? null}
      />
    </div>
  );
}
