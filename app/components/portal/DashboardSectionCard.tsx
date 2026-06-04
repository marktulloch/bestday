import type { ReactNode } from "react";
import Link from "next/link";

export function DashboardSectionCard({
  title,
  description,
  children,
  footer,
  href,
  actionLabel,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col h-full min-h-[140px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>
          ) : null}
        </div>
        {href && actionLabel ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-[#4EDD00] hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
      {footer ? <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div> : null}
    </section>
  );
}
