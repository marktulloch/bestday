"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Script from "next/script";

import { buildCalendlyEmbedUrl } from "@/lib/booking/calendly-embed-url";

type Props = {
  /** Full Calendly URL (event type or landing page). */
  calendlyBaseUrl: string;
  email?: string;
  name?: string;
  /** Shown above the widget. Defaults to portal copy. */
  intro?: ReactNode;
  /** When the visitor completes scheduling (Calendly postMessage). */
  onEventScheduled?: () => void;
};

/**
 * Inline Calendly widget (native Calendly UI within the frame).
 */
export function CalendlyEmbed({ calendlyBaseUrl, email, name, intro, onEventScheduled }: Props) {
  const dataUrl = buildCalendlyEmbedUrl(calendlyBaseUrl, { email, name });

  useEffect(() => {
    if (!onEventScheduled) return;
    const notifyScheduled = onEventScheduled;

    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://calendly.com") return;
      const ev = (e.data as { event?: string } | null)?.event;
      if (ev === "calendly.event_scheduled") {
        notifyScheduled();
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onEventScheduled]);

  if (!dataUrl) {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
        Booking is not configured. Set <code className="text-xs">NEXT_PUBLIC_CALENDLY_BOOKING_URL</code>{" "}
        in your environment.
      </p>
    );
  }

  return (
    <div className="w-full space-y-3">
      {intro ?? (
        <p className="text-sm text-gray-600">
          Choose a time below. Your booking will appear on this dashboard once Calendly confirms it.
        </p>
      )}
      <div
        className="calendly-inline-widget rounded-xl overflow-hidden border border-gray-200 bg-white min-w-[320px] h-[min(720px,85vh)] min-h-[560px]"
        data-url={dataUrl}
      />
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
    </div>
  );
}
