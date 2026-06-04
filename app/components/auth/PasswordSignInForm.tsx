"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export function PasswordSignInForm({
  nextPath,
}: {
  nextPath: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      const safe = nextPath.startsWith("/") ? nextPath : "/portal";
      window.location.assign(
        `/auth/after-signin?next=${encodeURIComponent(safe)}`,
      );
    } catch (e) {
      const msg =
        e instanceof TypeError && (e.message === "Failed to fetch" || e.message.includes("fetch"))
          ? "Could not reach Supabase (network error). Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, restart dev after changing them, confirm the project is not paused, and disable extensions/VPN that block API calls."
          : e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00] text-gray-900"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[#4EDD00] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00] text-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3db800] transition-colors"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-gray-600">
        New to Best Day?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-[#4EDD00] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
