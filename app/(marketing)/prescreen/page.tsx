import { Suspense } from "react";

import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";
import PrescreenStepOneForm from "./PrescreenStepOneForm";

function PrescreenFormFallback() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-4 w-24 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded-lg" />
      <div className="h-10 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function PrescreenPage() {
  return (
    <Container>
      <Section>
        <Card>
          <Suspense fallback={<PrescreenFormFallback />}>
            <PrescreenStepOneForm />
          </Suspense>
        </Card>
      </Section>
    </Container>
  );
}
