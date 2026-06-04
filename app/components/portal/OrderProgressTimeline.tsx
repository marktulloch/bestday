import type { OrderTimelineStep } from "@/lib/orders/order-timeline";

export function OrderProgressTimeline({ steps }: { steps: OrderTimelineStep[] }) {
  if (steps.length === 0) return null;

  return (
    <ol className="relative border-l border-gray-200 ml-2 pl-5 space-y-6">
      {steps.map((s) => (
        <li key={s.key} className="relative">
          <span
            className={
              "absolute -left-[21px] mt-1 flex h-2.5 w-2.5 rounded-full ring-4 ring-white " +
              (s.done ? "bg-[#4EDD00]" : s.current ? "bg-amber-500" : "bg-gray-300")
            }
            aria-hidden
          />
          <p className={"text-sm font-medium " + (s.done || s.current ? "text-gray-900" : "text-gray-500")}>
            {s.label}
          </p>
          {s.detail ? <p className="mt-1 text-xs text-gray-600 leading-relaxed">{s.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}
