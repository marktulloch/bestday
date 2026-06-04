"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 border border-[#4EDD00] text-[#0d2e0d] bg-[#E8FBE0] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d4f5c4] transition-colors"
    >
      {pending ? "Sending link…" : "Email me a sign-in link"}
    </button>
  );
}

export function MagicLinkForm({
  action,
  nextPath = "/portal",
}: {
  action: (formData: FormData) => void | Promise<void>;
  nextPath?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="magic-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00]"
          placeholder="you@example.com"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
