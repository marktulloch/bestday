import Link from "next/link";

export default function CustomerCareHomePage() {
  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your care</h1>
      <p className="text-sm text-gray-600 max-w-xl mb-8">
        This route is restricted to the customer role. Build patient-specific flows
        (bookings, documents, orders) here while keeping staff on /admin and /doctor.
      </p>
      <Link href="/portal" className="text-sm font-medium text-[#4EDD00] hover:underline">
        Back to portal home
      </Link>
    </div>
  );
}
