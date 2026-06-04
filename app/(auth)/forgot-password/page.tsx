import Link from "next/link";

import { ForgotPasswordExperience } from "./ForgotPasswordExperience";

export default function ForgotPasswordPage() {
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

  return (
    <div className="w-full max-w-md">
      <ForgotPasswordExperience />
    </div>
  );
}
