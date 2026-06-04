"use client";

import { useEffect } from "react";
import Link from "next/link";

import { trackPrescreenEvent } from "@/lib/analytics/prescreen-events";
import { MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE } from "@/lib/mc-flow/messages";

export type PrescreenCompleteOutcome = "eligible" | "booking" | "review" | "ineligible";

type Props = {
  outcome: PrescreenCompleteOutcome;
  /** Account was created after pre-screen but automatic sign-in failed — user should log in manually. */
  manualSignIn?: boolean;
};

export default function PrescreenCompleteView({ outcome, manualSignIn }: Props) {
  useEffect(() => {
    trackPrescreenEvent("prescreen_flow_completed", { outcome });
  }, [outcome]);

  if (outcome === "eligible" || outcome === "booking") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">You&apos;re eligible to continue</h1>
        <p className="text-sm text-gray-600">
          {manualSignIn ? (
            <>
              Your account was created. Use <span className="font-medium">Log in</span> with the email and
              password you just entered to open the patient portal and continue (intake, service selection,
              and payment when you&apos;re ready).
            </>
          ) : (
            <>
              Based on your answers, you can register or sign in and complete the next steps in the
              patient portal (profile, intake, service selection, and payment when you&apos;re ready).
            </>
          )}
        </p>
        <Link
          href={
            manualSignIn
              ? "/login?next=%2Fprescreen%2Fschedule&from=prescreen"
              : "/login?next=/portal&from=prescreen"
          }
          className="inline-flex w-full justify-center rounded-lg bg-[#4EDD00] px-4 py-3 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
        >
          {manualSignIn ? "Log in to book your consultation" : "Log in to continue"}
        </Link>
        <Link
          href="/portal"
          className="inline-flex w-full justify-center rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Already signed in — open portal
        </Link>
        <p className="text-center text-xs text-gray-500">
          First time?{" "}
          <Link href="/signup?next=/portal" className="font-medium text-[#3a9e00] hover:underline">
            Create a patient account
          </Link>{" "}
          to continue your care journey.
        </p>
      </div>
    );
  }

  if (outcome === "review") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">We&apos;ll review your details</h1>
        <p className="text-sm text-gray-600">
          Your answers need a quick clinical or administrative review. We&apos;ve opened a case for our team
          and may contact you using the email you provided, if any.
        </p>
        <Link
          href="/login?next=/portal&from=prescreen"
          className="inline-flex w-full justify-center rounded-lg bg-[#4EDD00] px-4 py-3 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
        >
          Log in to patient portal
        </Link>
        <p className="text-center text-xs text-gray-500">
          We&apos;ll use your email to match this submission when you sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Not eligible online right now</h1>
      <p className="text-sm text-gray-600">{MC_PRESCREEN_INELIGIBLE_PUBLIC_MESSAGE}</p>
      <Link
        href="/"
        className="inline-flex justify-center w-full py-3 px-4 bg-white border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50"
      >
        Back to home
      </Link>
    </div>
  );
}
