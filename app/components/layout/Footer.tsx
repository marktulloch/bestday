import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-auto">
      <Container>
        <div className="py-8">
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              This service provides access to registered healthcare professionals. Consultations are conducted in accordance with New Zealand medical practice standards. This service is not intended for emergency medical situations.
            </p>
            <p className="text-xs">
              Best Day operates in compliance with New Zealand healthcare regulations and privacy legislation, including the Health Information Privacy Code 2020 and the Privacy Act 2020.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
