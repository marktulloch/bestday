"use client";

import { useState } from "react";
import Link from "next/link";

import { AuthCard } from "@/app/components/auth/AuthCard";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordExperience() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const site = process.env.NEXT_PUBLIC_SITE_URL;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!site) {
      setError("Site URL is not configured.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${site}/auth/callback?next=${encodeURIComponent("/portal")}`,
        },
      );
      if (resetErr) {
        setError(resetErr.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If an account exists for that address, we sent a link to reset your password."
      >
        <div className="text-center space-y-4">
          <Link href="/login" className="text-sm font-medium text-[#4EDD00] hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the email you use for Best Day. We&apos;ll send a secure reset link."
    >
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
          <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00]"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium disabled:opacity-50 hover:bg-[#3db800] transition-colors"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-[#4EDD00] hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
