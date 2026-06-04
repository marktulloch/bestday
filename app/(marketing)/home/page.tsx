import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import FAQ from "@/app/components/ui/FAQ";
import HeroButtons from "./HeroButtons";
import TrustIndicators from "./TrustIndicators";

export default function HomePage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[520px] sm:min-h-[620px] md:min-h-[720px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/best-day-hero.png')",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Full-width hero content (NOT Container) */}
        <div className="relative z-10 max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-10">
          <div className="flex items-center h-full min-h-[520px] sm:min-h-[620px] md:min-h-[720px]">
            {/* Push card to the right */}
            <div className="ml-auto w-full max-w-sm sm:max-w-md">
              <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 md:p-8">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">
                  Telehealth · New Zealand
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2.5 leading-snug">
                  New Zealand&apos;s trusted medicinal cannabis clinic
                </h1>

                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                  Access registered healthcare professionals through our secure
                  telehealth platform. Clinical consultations follow NZ medical
                  practice standards.
                </p>

                <HeroButtons />
                <TrustIndicators />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section>
        <Container>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="text-2xl font-semibold text-yellow-600 mb-2">1</div>
              <h3 className="text-lg font-medium mb-2">
                Complete Prescreening
              </h3>
              <p className="text-gray-600">
                Provide basic information about your health status and
                consultation needs.
              </p>
            </div>

            <div>
              <div className="text-2xl font-semibold text-yellow-600 mb-2">2</div>
              <h3 className="text-lg font-medium mb-2">Consultation</h3>
              <p className="text-gray-600">
                Connect with a registered healthcare professional via secure
                video consultation.
              </p>
            </div>

            <div>
              <div className="text-2xl font-semibold text-yellow-600 mb-2">3</div>
              <h3 className="text-lg font-medium mb-2">Follow-up Care</h3>
              <p className="text-gray-600">
                Receive ongoing support and access to your consultation records.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* CONDITIONS SUPPORTED */}
      <Section>
        <Container>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
            Conditions Supported
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Chronic Pain Management
              </h3>
              <p className="text-gray-600">
                Consultations for ongoing pain management support.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">
                Mental Health Support
              </h3>
              <p className="text-gray-600">
                Access to mental health consultations and support services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">General Wellness</h3>
              <p className="text-gray-600">
                Consultations for general health and wellness inquiries.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">
                Specialist Referrals
              </h3>
              <p className="text-gray-600">
                Coordination with specialist healthcare providers when needed.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* WHY BEST DAY */}
      <Section>
        <Container>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
            Why Best Day
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg font-medium mb-2">New Zealand Based</h3>
              <p className="text-gray-600">
                Our platform operates within New Zealand, ensuring compliance
                with local healthcare regulations and standards.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Compliance First</h3>
              <p className="text-gray-600">
                We prioritise adherence to New Zealand medical regulations and
                maintain strict privacy and security standards.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Container>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>

          <FAQ
            items={[
              {
                question: "Who can use this service?",
                answer:
                  "This service is available to individuals aged 18 years and over who are located in New Zealand. You must complete the prescreening assessment before accessing consultations.",
              },
              {
                question: "What types of consultations are available?",
                answer:
                  "Our platform provides access to registered healthcare professionals for various health concerns including chronic pain management, mental health support, general wellness, and specialist referrals.",
              },
              {
                question: "How do I access my consultation records?",
                answer:
                  "Following your consultation, you will have access to your medical records and treatment plans through the platform. All information is stored securely in compliance with New Zealand privacy legislation.",
              },
              {
                question: "Is my information secure?",
                answer:
                  "Yes. We maintain strict privacy and security standards in accordance with New Zealand privacy legislation.",
              },
            ]}
          />
        </Container>
      </Section>
    </>
  );
}
