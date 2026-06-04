import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";

export default function MedicalTeamPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[420px] sm:min-h-[520px] md:min-h-[620px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/medical-team.png')",
          }}
        />

        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <Container>
          <div className="relative z-10 flex items-center min-h-[420px] sm:min-h-[520px] md:min-h-[620px]">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4">
                Our Medical Team
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                Meet the registered healthcare professionals delivering
                trusted, compliant medicinal cannabis care across New Zealand.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* PAGE CONTENT */}
      <Section>
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Our Healthcare Professionals
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our team of registered healthcare professionals is committed to providing safe, compliant, and patient-focused medicinal cannabis consultations.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
