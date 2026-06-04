"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CalendlyEmbed } from "@/app/components/booking/CalendlyEmbed";

type Props = {
  calendlyUrl: string;
  email?: string;
  name?: string;
};

/**
 * Calendly inline widget with prefilled patient details. Webhook persists bookings in Supabase;
 * the postMessage handler is UX-only (not authoritative).
 */
export function PortalBookingCalendly({ calendlyUrl, email, name }: Props) {
  const router = useRouter();
  const [schedulingHint, setSchedulingHint] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {schedulingHint ? (
        <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          {schedulingHint}
        </p>
      ) : null}
      <CalendlyEmbed
        calendlyBaseUrl={calendlyUrl}
        email={email}
        name={name}
        onEventScheduled={() => {
          setSchedulingHint("Appointment booked. Returning to your dashboard...");
          window.setTimeout(() => {
            router.refresh();
            router.push("/portal");
          }, 2200);
        }}
      />
    </div>
  );
}
