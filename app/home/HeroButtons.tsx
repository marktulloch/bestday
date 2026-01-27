"use client";

import { useRouter } from "next/navigation";

export default function HeroButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => router.push("/prescreen")}
        className="w-full px-6 py-4 bg-[#0F3D2E] text-white rounded-lg font-medium hover:bg-[#0C3326] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:ring-offset-2"
      >
        New Patient
      </button>
      <button
        onClick={() => router.push("#")}
        className="w-full px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
      >
        Returning Patient
      </button>
    </div>
  );
}
