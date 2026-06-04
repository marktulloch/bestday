import Link from "next/link";
import { redirect } from "next/navigation";

import Card from "@/app/components/ui/Card";
import { getAuthContext } from "@/lib/auth/session";
import { userCanAccessCalendlyBooking } from "@/lib/portal/booking-access";
import { getLatestPrescreenForUser } from "@/lib/portal/dashboard-data";

export const dynamic = "force-dynamic";

export default async function BookingUnavailablePage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/portal/booking");
  }

  const prescreen = await getLatestPrescreenForUser(ctx.user.id);
  if (userCanAccessCalendlyBooking(prescreen.record, prescreen.mcRecord)) {
    redirect("/portal/booking");
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <Card>
        <h1 className="text-xl font-semibold text-gray-900">Booking isn&apos;t available yet</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Only patients who are <span className="font-medium">eligible to book</span> can open the
          scheduler. Complete pre-screening first; once your status shows eligible, you can return here
          to choose a time.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Current status:{" "}
          <span className="font-medium text-gray-900">{prescreen.label}</span>
          {" — "}
          {prescreen.detail}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/prescreen"
            className="inline-flex justify-center py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium hover:bg-[#3db800] text-center"
          >
            Continue pre-screening
          </Link>
          <Link
            href="/portal"
            className="inline-flex justify-center py-3 px-4 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 text-center"
          >
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
