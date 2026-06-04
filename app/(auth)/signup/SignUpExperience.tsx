"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signUpPatientValidated } from "@/app/(auth)/signup/actions";
import { AuthCard } from "@/app/components/auth/AuthCard";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00] text-sm";

export function SignUpExperience({
  nextPath,
  mcPrescreenCookieStatus,
}: {
  nextPath: string;
  mcPrescreenCookieStatus: string | null;
}) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (mcPrescreenCookieStatus === "ineligible") {
    return (
      <AuthCard title="Registration unavailable" subtitle="Pre-screening outcome">
        <p className="text-sm text-gray-700 leading-relaxed">{MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE}</p>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-medium text-[#4EDD00] hover:underline">
            Return home
          </Link>
        </p>
      </AuthCard>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signUpPatientValidated({
        email: email.trim(),
        confirmEmail: confirmEmail.trim(),
        password,
        confirmPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || null,
        dateOfBirth,
        gender: gender.trim(),
        mobile: mobile.trim(),
        termsAccepted,
        privacyAccepted,
      });
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        setError(
          "Your account was created but sign-in failed. Please use “Sign in” with the password you chose.",
        );
        setLoading(false);
        return;
      }

      router.push(`/auth/after-signin?next=${encodeURIComponent(nextPath)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Complete your details to register as a patient. You must be at least 20 years old."
    >
      <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {error ? (
          <p
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-fn" className="block text-sm font-medium text-gray-700 mb-1">
              First name *
            </label>
            <input
              id="su-fn"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="su-ln" className="block text-sm font-medium text-gray-700 mb-1">
              Last name *
            </label>
            <input
              id="su-ln"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="su-pref" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="su-pref"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-dob" className="block text-sm font-medium text-gray-700 mb-1">
              Date of birth * <span className="text-gray-400 font-normal text-xs">YYYY-MM-DD</span>
            </label>
            <input
              id="su-dob"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="su-gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <input
              id="su-gender"
              required
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputCls}
              autoComplete="sex"
            />
          </div>
        </div>

        <div>
          <label htmlFor="su-mobile" className="block text-sm font-medium text-gray-700 mb-1">
            Mobile *
          </label>
          <input
            id="su-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={inputCls}
            autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="su-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="su-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="su-cemail" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm email *
          </label>
          <input
            id="su-cemail"
            type="email"
            required
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className={inputCls}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="su-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            id="su-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="su-cpassword" className="block text-sm font-medium text-gray-700 mb-1">
            Repeat password *
          </label>
          <input
            id="su-cpassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
          <label className="flex gap-2 items-start text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
            />
            <span>I accept the terms of use *</span>
          </label>
          <label className="flex gap-2 items-start text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
            />
            <span>I accept the privacy policy *</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium disabled:opacity-50 hover:bg-[#3db800] transition-colors"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-[#4EDD00] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
