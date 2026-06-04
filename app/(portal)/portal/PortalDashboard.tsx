import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardSectionCard } from "@/app/components/portal/DashboardSectionCard";
import { getUpcomingAppointmentForUser } from "@/lib/portal/appointment-data";
import { userCanAccessCalendlyBooking } from "@/lib/portal/booking-access";
import { getLatestPrescreenForUser } from "@/lib/portal/dashboard-data";
import { getAuthContext } from "@/lib/auth/session";
import { formatPrice } from "@/lib/products/format-price";
import {
  getCustomerIdForUser,
  getDraftOrderForCustomer,
  listPurchaseOrdersForCustomer,
} from "@/lib/orders/purchase-queries";
import { listTicketsForCustomer } from "@/lib/tickets/queries";

export default async function PortalDashboard() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10">
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
          Supabase environment variables are not set.
        </p>
      </div>
    );
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/portal");
  }

  const { user, profile } = ctx;
  if (profile.role === "master" || profile.role === "admin") {
    redirect("/admin");
  }
  if (profile.role === "doctor") {
    redirect("/doctor");
  }
  const [prescreen, upcoming] = await Promise.all([
    getLatestPrescreenForUser(user.id),
    getUpcomingAppointmentForUser(user.id),
  ]);
  const canBook = userCanAccessCalendlyBooking(prescreen.record, prescreen.mcRecord);
  const prescreenUpdatedAt = prescreen.record?.created_at ?? prescreen.mcRecord?.created_at;

  const purchaseSummary: { draftLines: number; recentLabel: string | null; recentHref: string | null } = {
    draftLines: 0,
    recentLabel: null,
    recentHref: null,
  };
  let supportOpenCount = 0;
  if (profile.role === "customer") {
    const cid = await getCustomerIdForUser(user.id);
    if (cid) {
      const [draft, history, tickets] = await Promise.all([
        getDraftOrderForCustomer(cid),
        listPurchaseOrdersForCustomer(cid),
        listTicketsForCustomer(cid),
      ]);
      purchaseSummary.draftLines = draft?.items.length ?? 0;
      const recent = history[0];
      if (recent) {
        purchaseSummary.recentLabel = `${recent.status.replace(/_/g, " ")} · ${formatPrice(recent.total_cents, recent.currency)}`;
        purchaseSummary.recentHref = `/portal/orders/${recent.id}`;
      }
      supportOpenCount = tickets.filter(
        (t) => t.status !== "resolved" && t.status !== "closed",
      ).length;
    }
  }

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-8 md:py-12">
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
          Welcome back{profile.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Signed in as <span className="font-medium text-gray-800">{user.email}</span>
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardSectionCard
          title="Upcoming appointment"
          description="Video consultations and clinic bookings."
          href={canBook ? "/portal/booking" : "/prescreen"}
          actionLabel={
            upcoming ? "Details" : canBook ? "Book appointment" : "Pre-screen"
          }
        >
          <div className="flex flex-col justify-center py-2 min-h-[72px]">
            {upcoming && upcoming.start_time ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {upcoming.calendly_event_type_name?.trim() || "Initial consultation"}
                </p>
                <p className="text-sm text-gray-800 mt-2">
                  {new Date(upcoming.start_time).toLocaleDateString("en-NZ", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: upcoming.timezone || undefined,
                  })}
                </p>
                <p className="text-sm text-gray-800">
                  {new Date(upcoming.start_time).toLocaleTimeString("en-NZ", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: upcoming.timezone || undefined,
                  })}
                </p>
                {upcoming.timezone ? (
                  <p className="text-xs text-gray-500 mt-0.5">{upcoming.timezone}</p>
                ) : null}
                <p className="text-sm text-gray-600 mt-2 capitalize">{upcoming.status}</p>
                {upcoming.location_join_url ? (
                  <a
                    href={upcoming.location_join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4EDD00] font-medium hover:underline mt-2"
                  >
                    Join meeting
                  </a>
                ) : upcoming.calendly_event_uri ? (
                  <a
                    href={upcoming.calendly_event_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4EDD00] font-medium hover:underline mt-2"
                  >
                    View booking link
                  </a>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  No upcoming appointment scheduled.
                </p>
                <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
                  {canBook
                    ? "You’re eligible — book a time that suits you."
                    : "Complete pre-screening to become eligible to book."}
                </p>
              </>
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Pre-screening"
          description="Your eligibility and questionnaire status."
          href="/prescreen"
          actionLabel={prescreen.record || prescreen.mcRecord ? "Update" : "Start"}
        >
          <div className="flex flex-col justify-center py-2 min-h-[72px]">
            <p className="text-sm font-medium text-gray-900">{prescreen.label}</p>
            <p className="text-sm text-gray-600 mt-1">{prescreen.detail}</p>
            {prescreen.answerLines.length > 0 ? (
              <ul className="mt-3 text-xs text-gray-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto border-t border-gray-100 pt-3">
                {prescreen.answerLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : null}
            {prescreenUpdatedAt ? (
              <p className="text-xs text-gray-400 mt-2">
                Last updated{" "}
                {new Date(prescreenUpdatedAt).toLocaleDateString("en-NZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Orders"
          description="Approved products, checkout, and delivery."
          href="/portal/orders"
          actionLabel="History"
        >
          <div className="flex flex-col justify-center py-2 min-h-[72px] text-sm text-gray-600">
            {profile.role === "customer" ? (
              <>
                {purchaseSummary.draftLines > 0 ? (
                  <p className="text-gray-900 font-medium">
                    {purchaseSummary.draftLines} item
                    {purchaseSummary.draftLines === 1 ? "" : "s"} in your current order
                  </p>
                ) : (
                  <p className="text-gray-500">No open cart.</p>
                )}
                <Link
                  href="/portal/cart"
                  className="text-xs text-[#4EDD00] font-medium hover:underline mt-2"
                >
                  View current order →
                </Link>
                {purchaseSummary.recentLabel && purchaseSummary.recentHref ? (
                  <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-3">
                    Last:{" "}
                    <Link href={purchaseSummary.recentHref} className="text-gray-800 hover:underline">
                      {purchaseSummary.recentLabel}
                    </Link>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-3">No submitted orders yet.</p>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center">Order placement is available to patient accounts.</p>
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Support"
          description="Questions and requests to our team."
          href="/portal/tickets"
          actionLabel="Open"
        >
          <div className="flex flex-col justify-center py-2 min-h-[72px] text-sm text-gray-600">
            {profile.role === "customer" ? (
              <>
                {supportOpenCount > 0 ? (
                  <p className="text-gray-900 font-medium">
                    {supportOpenCount} open conversation{supportOpenCount === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="text-gray-500">No open conversations.</p>
                )}
                <Link
                  href="/portal/tickets/new"
                  className="text-xs text-[#4EDD00] font-medium hover:underline mt-2"
                >
                  New request →
                </Link>
              </>
            ) : (
              <p className="text-gray-500 text-center">Support is available to patient accounts.</p>
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Profile"
          description="Your details and preferences."
          href="/portal/profile"
          actionLabel="Manage"
        >
          <ul className="text-sm text-gray-600 space-y-2 py-1">
            <li>
              <span className="text-gray-500">Name:</span>{" "}
              {profile.full_name || "Not set"}
            </li>
            <li>
              <span className="text-gray-500">Account:</span> {profile.role}
            </li>
          </ul>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Documents & messages"
          description="Letters, scripts, and secure messages."
        >
          <div className="flex flex-col items-center justify-center py-4 text-center min-h-[72px]">
            <p className="text-sm text-gray-500">No documents yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Shared files and clinician messages will show here when available.
            </p>
          </div>
        </DashboardSectionCard>
      </div>

      <p className="mt-10 text-center sm:text-left text-sm text-gray-500">
        Need the public site?{" "}
        <Link href="/" className="font-medium text-[#4EDD00] hover:underline">
          Return to homepage
        </Link>
      </p>
    </div>
  );
}
