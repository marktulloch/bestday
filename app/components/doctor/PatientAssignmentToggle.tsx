"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { togglePatientAssignment } from "@/app/(staff)/doctor/actions";

export function PatientAssignmentToggle({
  customerId,
  assignedToMe,
}: {
  customerId: string;
  assignedToMe: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await togglePatientAssignment(customerId, !assignedToMe);
            if (!res.ok) {
              setError(res.error ?? "Could not update assignment");
              return;
            }
            router.refresh();
          });
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "…" : assignedToMe ? "Remove from my list" : "Add to my list"}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
