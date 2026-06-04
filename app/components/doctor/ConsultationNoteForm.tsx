"use client";

import { useActionState } from "react";

import { addConsultationNote } from "@/app/(staff)/doctor/actions";

export function ConsultationNoteForm({
  customerId,
  appointments,
}: {
  customerId: string;
  /** Optional: link this note to a booking */
  appointments?: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(addConsultationNote, {
    ok: false,
  });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      {appointments && appointments.length > 0 ? (
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Link to appointment (optional)</span>
          <select
            name="appointmentId"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
            defaultValue=""
          >
            <option value="">General note (no appointment)</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Consultation note</span>
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Clinical observations, plan, follow-up…"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4EDD00] focus:ring-1 focus:ring-[#4EDD00] outline-none"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700">Note saved.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#4EDD00] px-4 py-2 text-sm font-semibold text-[#0d2e0d] hover:bg-[#3bc200] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
