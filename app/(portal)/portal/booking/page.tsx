import { redirect } from "next/navigation";

import { PortalBookingCalendly } from "@/app/components/portal/PortalBookingCalendly";
import Card from "@/app/components/ui/Card";
import { getAuthContext } from "@/lib/auth/session";
import { userCanAccessCalendlyBooking } from "@/lib/portal/booking-access";
import { getLatestPrescreenForUser } from "@/lib/portal/dashboard-data";

export const dynamic = "force-dynamic";

export default async function PortalBookingPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/portal/booking");
  }

  const prescreen = await getLatestPrescreenForUser(ctx.user.id);
  if (!userCanAccessCalendlyBooking(prescreen.record, prescreen.mcRecord)) {
    redirect("/portal/booking/unavailable");
  }

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_BOOKING_URL?.trim() ?? "";
  const displayName =
    ctx.profile.full_name?.trim() ||
    [ctx.user.user_metadata?.first_name, ctx.user.user_metadata?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "";

  return (
    <div className="max-w-[960px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Book a consultation</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl">
          You&apos;re eligible to schedule. Pick a time that works for you — we&apos;ll save the booking
          to your Best Day account automatically.
        </p>
      </header>
      <Card>
        <PortalBookingCalendly
          calendlyUrl={calendlyUrl}
          email={ctx.user.email ?? undefined}
          name={displayName || undefined}
        />
      </Card>
    </div>
  );
}
