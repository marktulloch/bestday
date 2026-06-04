import { redirect } from "next/navigation";

import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";
import { getAuthContext } from "@/lib/auth/session";

import { PrescreenScheduleClient } from "./PrescreenScheduleClient";

export const dynamic = "force-dynamic";

export default async function PrescreenSchedulePage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/prescreen/schedule");
  }

  const email = ctx.user.email?.trim() ?? "";
  const displayName =
    ctx.profile.full_name?.trim() ||
    [ctx.user.user_metadata?.first_name, ctx.user.user_metadata?.last_name].filter(Boolean).join(" ").trim() ||
    "";

  return (
    <Container>
      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Next step
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Book your consultation
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Select a time that works for you. After you confirm in the calendar, continue to the sign-in
              page to access your portal.
            </p>
          </header>

          <Card>
            <PrescreenScheduleClient email={email} displayName={displayName} />
          </Card>
        </div>
      </Section>
    </Container>
  );
}
