import { Suspense } from "react";
import Link from "next/link";

import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

import McPrescreeningForm from "./McPrescreeningForm";

function PrescreenFormFallback() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-4 w-24 rounded bg-gray-100" />
      <div className="h-10 rounded-lg bg-gray-100" />
      <div className="h-10 rounded-lg bg-gray-100" />
    </div>
  );
}

export default async function PrescreenPage() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );

  let isSignedIn = false;
  if (hasSupabase) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isSignedIn = Boolean(user);
    } catch {
      isSignedIn = false;
    }
  }

  return (
    <Container>
      <Section>
        <div className="mx-auto max-w-2xl space-y-6">
          <header>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Medicinal cannabis pathway
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Pre-screening
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isSignedIn ? (
                <>
                  You&apos;re signed in. Submit a new clinical pre-screen below. Your account details are
                  already on file.
                </>
              ) : (
                <>
                  Create your patient account and complete the clinical questionnaire in one step. We only
                  create your login if you are eligible from your answers. You must be at least 20 years
                  old.
                </>
              )}
            </p>
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/90 px-4 py-3 text-sm text-gray-700">
              <span className="font-medium text-gray-900">Already a patient?</span>{" "}
              <Link
                href="/login?next=/portal"
                className="font-medium text-[#3a9e00] underline-offset-2 hover:underline"
              >
                Log in to your portal
              </Link>{" "}
              for bookings and messages.
            </div>
          </header>

          {!hasSupabase ? (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="status"
            >
              This page cannot save pre-screens until{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set
              (e.g. in <code className="rounded bg-amber-100/80 px-1">.env.local</code>).
            </p>
          ) : null}

          <Card>
            <Suspense fallback={<PrescreenFormFallback />}>
              <McPrescreeningForm isSignedIn={isSignedIn} />
            </Suspense>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
