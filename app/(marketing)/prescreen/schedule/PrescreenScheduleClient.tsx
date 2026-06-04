"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { CalendlyEmbed } from "@/app/components/booking/CalendlyEmbed";
import { getCalendlyPostPrescreenEmbedUrl } from "@/lib/booking/calendly-embed-url";

type Props = {
  email: string;
  displayName: string;
};

/**
 * After MC pre-screen + account, patient picks a consultation time; then redirect to login for handoff.
 */
export function PrescreenScheduleClient({ email, displayName }: Props) {
  const router = useRouter();
  const calendlyUrl = getCalendlyPostPrescreenEmbedUrl();

  const onScheduled = useCallback(() => {
    router.push("/login?next=/portal&from=calendly");
  }, [router]);

  return (
    <CalendlyEmbed
      calendlyBaseUrl={calendlyUrl}
      email={email || undefined}
      name={displayName || undefined}
      onEventScheduled={onScheduled}
      intro={
        <p className="text-sm text-gray-600">
          You&apos;re eligible — choose a consultation time below. When your booking is confirmed,
          you&apos;ll be taken to sign in so you can continue in the patient portal.
        </p>
      }
    />
  );
}
