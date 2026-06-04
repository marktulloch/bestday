export default function TrustIndicators() {
  const indicators = [
    {
      label: "NZ clinicians",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Personalised care",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      label: "Private & secure",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-5 border-t border-gray-100 pt-5 sm:mt-6 sm:pt-6">
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {indicators.map((indicator) => (
          <li
            key={indicator.label}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FBE0] text-[#0d2e0d]">
              {indicator.icon}
            </span>
            <span className="text-[11px] leading-tight text-gray-600 sm:text-xs">{indicator.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
