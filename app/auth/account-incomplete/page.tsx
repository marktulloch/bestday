import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/app/components/auth/SignOutButton";

type PageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

/**
 * Shown when Auth has a session but there is no usable profile row / role (after bootstrap RPC).
 * Database errors while reading profiles are handled on /auth/profile-load-failed instead.
 */
export default async function AccountIncompletePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  if (sp.reason === "db_error") {
    redirect("/auth/profile-load-failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-950">
        <h1 className="text-lg font-semibold text-amber-950 mb-2">Account setup incomplete</h1>
        <p className="text-amber-900/90 mb-4 leading-relaxed">
          You are signed in, but there is no profile row (or no role) for this account yet. That
          usually means migrations are not fully applied, or the Auth user was never linked to a row
          in <code className="text-xs bg-white/70 px-1 rounded">profiles</code>.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-amber-900/90 mb-6">
          <li>
            In Supabase: run all SQL migrations in{" "}
            <code className="text-xs bg-white/70 px-1 rounded">supabase/migrations/</code> in order
            (including <code className="text-xs bg-white/70 px-1 rounded">ensure_own_profile</code>{" "}
            and the <code className="text-xs bg-white/70 px-1 rounded">profiles_rls_mvp</code>{" "}
            files).
          </li>
          <li>
            Then run <code className="text-xs bg-white/70 px-1 rounded">npm run seed:test-users</code>{" "}
            or <code className="text-xs bg-white/70 px-1 rounded">npm run seed:master</code>. Seeding
            uses upsert — safe to re-run.
          </li>
          <li>
            Staging only: <code className="text-xs bg-white/70 px-1 rounded">ENABLE_SEEDED_PROFILE_RECONCILE=true</code>{" "}
            plus <code className="text-xs bg-white/70 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            reconciles known test emails on sign-in. Leave unset or false in production.
          </li>
        </ul>
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
