import type { ReactNode } from "react";

export function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md shadow-gray-200/40 sm:p-8">
      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
