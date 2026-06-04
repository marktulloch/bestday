import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";

import PrescreenCompleteView, {
  type PrescreenCompleteOutcome,
} from "../PrescreenCompleteView";

function normalizeOutcome(raw: string | undefined): PrescreenCompleteOutcome {
  if (raw === "eligible") {
    return "eligible";
  }
  if (raw === "booking" || raw === "review" || raw === "ineligible") {
    return raw;
  }
  return "review";
}

export default async function PrescreenCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; signin?: string }>;
}) {
  const { outcome: raw, signin } = await searchParams;
  const outcome = normalizeOutcome(raw);
  const manualSignIn = signin === "manual";

  return (
    <Container>
      <Section>
        <Card>
          <PrescreenCompleteView outcome={outcome} manualSignIn={manualSignIn} />
        </Card>
      </Section>
    </Container>
  );
}
