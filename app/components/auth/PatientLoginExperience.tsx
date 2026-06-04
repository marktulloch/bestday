"use client";

import { useState } from "react";
import Link from "next/link";

import { sendMagicLink } from "@/lib/auth/magic-link";
import { AuthCard } from "@/app/components/auth/AuthCard";
import { MagicLinkForm } from "@/app/components/auth/MagicLinkForm";
import { PasswordSignInForm } from "@/app/components/auth/PasswordSignInForm";

type Tab = "password" | "magic";

export function PatientLoginExperience({
  nextPath,
  fromPrescreen,
  magicCheckEmail,
  serverError,
}: {
  nextPath: string;
  fromPrescreen: boolean;
  magicCheckEmail: boolean;
  serverError: string | null;
}) {
  const [tab, setTab] = useState<Tab>("password");

  if (magicCheckEmail) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent you a secure sign-in link. It may take a minute to arrive."
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            You can close this page or return to the link in your inbox.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-[#4EDD00] hover:underline"
          >
            Use a different email
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Patient login"
      subtitle="Secure access to your portal — appointments, orders, and care team messages."
    >
      {fromPrescreen ? (
        <div className="mb-6 rounded-lg bg-[#E8FBE0] border border-[#C5F0B0] px-4 py-3 text-sm text-[#0d2e0d]">
          Your pre-screening was saved. Sign in or create an account with the{" "}
          <strong>same email</strong> to connect it to your portal.
        </div>
      ) : null}

      {serverError ? (
        <p
          className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          role="alert"
        >
          {serverError === "auth"
            ? "Sign-in failed. Please try again."
            : serverError === "missing_email"
              ? "Please enter your email address."
              : serverError === "missing_site_url"
                ? "Server misconfiguration: NEXT_PUBLIC_SITE_URL is not set."
                : decodeURIComponent(serverError)}
        </p>
      ) : null}

      <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50/80">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "password"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Email & password
        </button>
        <button
          type="button"
          onClick={() => setTab("magic")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "magic"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Magic link
        </button>
      </div>

      {tab === "password" ? (
        <PasswordSignInForm nextPath={nextPath} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            No password needed — we&apos;ll email you a one-time link (valid for a short time).
          </p>
          <MagicLinkForm action={sendMagicLink} nextPath={nextPath} />
        </div>
      )}

      <p className="mt-7 text-center text-xs leading-relaxed text-gray-500">
        Encrypted sign-in · NZ privacy standards apply. By continuing you accept our telehealth and
        privacy practices.
      </p>
    </AuthCard>
  );
}
