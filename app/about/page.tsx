import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";

export default function AboutPage() {
  return (
    <>
      {/* HERO / INTRO SECTION */}
      <section className="bg-brand-secondary py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-6">
              Bringing trusted medicinal cannabis solutions to New Zealand
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              Best Day is committed to providing safe, compliant, and
              patient-focused access to medicinal cannabis consultations through
              a secure and entirely online healthcare platform.
            </p>
          </div>
        </Container>
      </section>

      {/* CONTENT SECTION */}
      <Section>
        <Container>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Patient-first care
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform connects patients with registered healthcare
                professionals who are experienced in assessing eligibility for
                medicinal cannabis treatment in accordance with New Zealand
                medical guidelines.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Every consultation is conducted with clinical integrity,
                transparency, and respect for patient privacy.
              </p>
            </div>

            <div className="bg-white border border-brand-borderSoft rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Clinical governance & compliance
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Best Day operates within New Zealand’s regulatory framework for
                medicinal cannabis. We prioritise privacy, informed consent, and
                responsible prescribing practices at every stage of care.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
