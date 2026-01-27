import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";
import PrescreenForm from "./PrescreenForm";

export default function PrescreenPage() {
  return (
    <Container>
      <Section>
        <Card>
          <PrescreenForm />
        </Card>
      </Section>
    </Container>
  );
}
