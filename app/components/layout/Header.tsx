"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll(); // set initial state
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "how-it-works", label: "How it works", href: "/how-it-works" },
    { id: "about", label: "About", href: "/about" },
    { id: "pricing", label: "Pricing", href: "/pricing" },
    { id: "medical-team", label: "Medical Team", href: "/medical-team" },
    { id: "faq", label: "FAQ", href: "/faq" },
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
        <div className="flex items-center justify-between h-16 md:h-20 px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-extrabold text-[#0F3D2E] tracking-tight"
          >
            BESTDAY
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="#"
              className="px-4 py-2 text-sm font-medium text-[#0F3D2E] border border-[#0F3D2E] rounded-lg hover:bg-[#E6F2ED] transition-colors"
            >
              Patient Login
            </Link>
            <Link
              href="/prescreen"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0F3D2E] rounded-lg hover:bg-[#0C3326] transition-colors"
            >
              Start pre-screening
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/prescreen"
              className="px-3 py-2 text-xs font-medium text-white bg-[#0F3D2E] rounded-lg"
            >
              Start
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#"
                className="mt-2 px-4 py-2 text-sm font-medium text-[#0F3D2E] border border-[#0F3D2E] rounded-lg"
              >
                Patient Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
