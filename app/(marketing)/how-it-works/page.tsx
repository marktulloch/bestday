import Link from "next/link";

import Container from "@/app/components/layout/Container";
import Section from "@/app/components/layout/Section";
import Card from "@/app/components/ui/Card";

export default function HowItWorksPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[420px] sm:min-h-[520px] md:min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/how-it-works.png')",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-10">
          <div className="flex items-center h-full min-h-[420px] sm:min-h-[520px] md:min-h-[600px]">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4">
                How it works
              </h1>
              <p className="text-base sm:text-lg text-white/90 leading-relaxed">
                Find out if you could benefit from medicinal cannabis through
                our simple, entirely online process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS STEPS */}
      <Section>
        <Container>
          <div className="space-y-6">
            <Card>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#4EDD00] text-[#0d2e0d] flex items-center justify-center text-xl font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Prescreening Assessment
                  </h2>
                  <p className="text-gray-700">
                    Before your consultation, you will complete a prescreening
                    questionnaire. This helps our healthcare professionals
                    understand your medical history, current health status, and
                    consultation requirements. The information provided is
                    reviewed to ensure appropriate care can be delivered through
                    our telehealth platform.
                  </p>
                  <p className="mt-4">
                    <Link
                      href="/prescreen"
                      className="inline-flex rounded-lg bg-[#4EDD00] px-4 py-2.5 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3db800]"
                    >
                      Start pre-screening
                    </Link>
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#4EDD00] text-[#0d2e0d] flex items-center justify-center text-xl font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Clinical Consultation
                  </h2>
                  <p className="text-gray-700">
                    You will be connected with a registered healthcare
                    professional via secure video consultation. During this
                    session, the clinician will conduct a clinical assessment,
                    discuss your health concerns, and provide medical guidance.
                    All consultations are conducted in accordance with New
                    Zealand medical practice standards and regulations.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#4EDD00] text-[#0d2e0d] flex items-center justify-center text-xl font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Ongoing Care Management
                  </h2>
                  <p className="text-gray-700">
                    Following your consultation, you will have access to your
                    medical records and any treatment plans developed during
                    your session. Our platform supports follow-up consultations
                    and coordination with other healthcare providers as needed.
                    All medical information is stored securely and in compliance
                    with New Zealand privacy legislation.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
