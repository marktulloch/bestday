"use client";

import { useActionState } from "react";

import { customerAddTicketCommentForm } from "@/app/(portal)/portal/tickets/actions";

export function CustomerTicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(customerAddTicketCommentForm, null);

  return (
    <form action={formAction} className="mt-6 rounded-xl border border-gray-200 bg-white p-5 space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <h3 className="text-sm font-semibold text-gray-900">Your reply</h3>
      {state?.ok === false && state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? <p className="text-sm text-green-800">Message sent.</p> : null}
      <textarea
        name="body"
        required
        rows={4}
        maxLength={8000}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="Write a message to our team…"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
