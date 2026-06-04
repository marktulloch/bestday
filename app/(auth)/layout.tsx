import Header from "@/app/components/layout/Header";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex flex-1 flex-col pt-14 sm:pt-16 md:pt-[4.25rem]">
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
        <footer className="mx-auto w-full max-w-[1120px] border-t border-gray-100 px-4 py-5 text-center text-xs text-gray-500 sm:px-6">
          <p className="leading-relaxed">
            Health information is handled under NZ privacy standards, including the Health Information
            Privacy Code.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Link href="/" className="font-medium text-[#3a9e00] hover:underline">
              Home
            </Link>
            <Link href="/prescreen" className="text-gray-600 hover:text-gray-900 hover:underline">
              Pre-screening
            </Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 hover:underline">
              How it works
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
