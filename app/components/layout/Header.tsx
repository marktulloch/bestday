"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isDemoMode } from "@/lib/demo-mode";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const navLinks = [
    { id: "how-it-works", label: "How it works", href: "/how-it-works" },
    { id: "products", label: "Learn", href: "/products" },
    { id: "about", label: "About", href: "/about" },
    { id: "pricing", label: "Pricing", href: "/pricing" },
    { id: "medical-team", label: "Medical team", href: "/medical-team" },
    { id: "faq", label: "FAQ", href: "/#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled ? "mt-2" : ""
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 ease-out ${
          isScrolled
            ? "max-w-[1200px] bg-white rounded-2xl shadow-xl"
            : "w-full bg-white/95 backdrop-blur-sm border-b border-gray-200"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:h-16 md:h-[4.25rem] sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Best Day – Home">
            <img
              src="/logo.png"
              alt="Best Day"
              className="h-8 w-auto sm:h-9 md:h-10"
              width={140}
              height={44}
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isDemoMode ? (
              // Demo mode: backend portal link temporarily disabled
              <span
                aria-disabled="true"
                className="cursor-default px-3.5 py-2 text-sm font-medium text-gray-700"
              >
                Log in
              </span>
            ) : (
              <Link
                href="/login?next=/portal"
                className="px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Log in
              </Link>
            )}
            <Link
              href="/prescreen"
              className="rounded-lg bg-[#4EDD00] px-3.5 py-2 text-sm font-semibold text-[#0d2e0d] transition-colors hover:bg-[#3db800]"
            >
              Pre-screen
            </Link>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            {isDemoMode ? (
              // Demo mode: backend portal link temporarily disabled
              <span
                aria-disabled="true"
                className="cursor-default px-2.5 py-1.5 text-xs font-medium text-gray-700"
              >
                Log in
              </span>
            ) : (
              <Link
                href="/login?next=/portal"
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700"
              >
                Log in
              </Link>
            )}
            <Link
              href="/prescreen"
              className="rounded-md bg-[#4EDD00] px-2.5 py-1.5 text-xs font-semibold text-[#0d2e0d]"
            >
              Pre-screen
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              className="ml-0.5 rounded-md p-2 text-gray-800 hover:bg-gray-100"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="flex max-h-[min(78vh,560px)] flex-col border-t border-gray-100 bg-white lg:hidden rounded-b-2xl">
            <div className="shrink-0 space-y-2 border-b border-gray-100 px-4 py-3">
              <Link
                href="/prescreen"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-lg bg-[#4EDD00] py-2.5 text-center text-sm font-semibold text-[#0d2e0d]"
              >
                Start pre-screening
              </Link>
              {isDemoMode ? (
                // Demo mode: backend portal link temporarily disabled
                <span
                  aria-disabled="true"
                  className="block w-full cursor-default rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-800"
                >
                  Log in to portal
                </span>
              ) : (
                <Link
                  href="/login?next=/portal"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-800"
                >
                  Log in to portal
                </Link>
              )}
              <p className="text-center text-[11px] text-gray-500">New vs returning — pick the path that fits</p>
            </div>
            <nav
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
              aria-label="Mobile"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
