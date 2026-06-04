"use client";

import { useActionState } from "react";

import { addConsultationRecommendation } from "@/app/(staff)/doctor/actions";

const outcomes = [
  { value: "follow_up", label: "Follow-up recommended" },
  { value: "monitoring", label: "Monitoring / watchful" },
  { value: "refer_external", label: "Refer externally" },
  { value: "care_complete", label: "Care episode complete" },
  { value: "other", label: "Other" },
] as const;

export function RecommendationForm({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState(addConsultationRecommendation, {
    ok: false,
  });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Summary title</span>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
          placeholder="e.g. Treatment plan — CBD oil trial"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Outcome / recommendation</span>
        <select
          name="outcome"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        >
          {outcomes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Detail</span>
        <textarea
          name="detail"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
          placeholder="Rationale, dosing guidance, patient education…"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700">Recommendation recorded.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save recommendation"}
      </button>
    </form>
  );
}
