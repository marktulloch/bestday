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
          {/* Your pricing tables / cards go here */}
        </Container>
      </Section>
    </>
  );
}
