import Link from "next/link";

const VIEWS = [
  { id: "relevant", label: "My queue" },
  { id: "me", label: "Assigned to me" },
  { id: "waiting_doctor", label: "Waiting on doctor" },
  { id: "patients", label: "My patients" },
] as const;

export function DoctorTicketFilters({
  currentView,
}: {
  currentView: (typeof VIEWS)[number]["id"];
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {VIEWS.map((v) => (
        <Link
          key={v.id}
          href={v.id === "relevant" ? "/doctor/tickets" : `/doctor/tickets?view=${v.id}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentView === v.id
              ? "bg-[#4EDD00] text-[#0d2e0d] shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
