import { DoctorTicketFilters } from "@/app/components/staff/DoctorTicketFilters";
import { TicketListTable } from "@/app/components/staff/TicketListTable";
import { requireDoctorWorkspace } from "@/lib/auth/doctor-guard";
import { getAssignedCustomerIdsForDoctor, listTicketsForDoctor } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export default async function DoctorTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const { userId } = await requireDoctorWorkspace({ forbiddenRedirect: "/portal" });
  const sp = (await searchParams) ?? {};
  const viewRaw = sp.view ?? "relevant";
  const view =
    viewRaw === "me" || viewRaw === "waiting_doctor" || viewRaw === "patients"
      ? viewRaw
      : "relevant";

  const assignedCustomerIds = await getAssignedCustomerIdsForDoctor(userId);
  const tickets = await listTicketsForDoctor(userId, assignedCustomerIds, view);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <header className="mb-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Cases assigned to you, waiting on a clinician, or linked to patients on your list.
        </p>
      </header>

      <DoctorTicketFilters currentView={view} />

      <TicketListTable tickets={tickets} detailHref={(id) => `/doctor/tickets/${id}`} />
    </div>
  );
}
