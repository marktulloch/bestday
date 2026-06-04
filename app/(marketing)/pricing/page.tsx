import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";

export default function PricingPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/pricing-hero.png')",
          }}
        />

        {/* Subtle overlay for text contrast */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Content */}
        <Container>
          <div className="relative z-10 flex items-center min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
            {/* Right-aligned text */}
            <div className="w-full flex justify-end">
              <div className="max-w-md text-right">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4">
                  Pricing
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-white/90">
                  Transparent pricing from New Zealand&apos;s trusted medicinal
                  cannabis clinic.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* PAGE CONTENT */}
      <Section>
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Consultation Pricing
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our consultation fees are transparent and aligned with New Zealand healthcare standards. Contact us for detailed pricing information.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
