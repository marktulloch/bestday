import Link from "next/link";

/**
 * Shown when staff layouts would otherwise call createClient() without public Supabase env.
 */
export function SupabaseEnvMissing({ area }: { area: "admin" | "doctor" }) {
  const title = area === "admin" ? "Admin" : "Doctor workspace";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold mb-2">{title} — Supabase is not configured</p>
        <p className="text-amber-900/90 mb-4">
          Add <code className="text-xs bg-white/80 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs bg-white/80 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="text-xs bg-white/80 px-1 rounded">.env.local</code> (see{" "}
          <code className="text-xs bg-white/80 px-1 rounded">.env.example</code>), then restart{" "}
          <code className="text-xs bg-white/80 px-1 rounded">next dev</code>.
        </p>
        <Link href="/" className="text-sm font-medium text-[#0d2e0d] underline">
          Return home
        </Link>
      </div>
    </div>
  );
}
