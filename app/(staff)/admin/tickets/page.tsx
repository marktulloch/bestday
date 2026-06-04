import { AdminOpsExportControls } from "@/app/components/staff/AdminOpsExportControls";
import { AdminTicketFilters } from "@/app/components/staff/AdminTicketFilters";
import { createClient } from "@/lib/supabase/server";
import { TicketListTable } from "@/app/components/staff/TicketListTable";
import type { TicketCategory, TicketStatus } from "@/lib/database.types";
import { listTicketsForAdmin } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set<TicketStatus>([
  "new",
  "in_progress",
  "waiting_on_customer",
  "waiting_on_doctor",
  "resolved",
  "closed",
]);

const CATEGORIES = new Set<TicketCategory>([
  "prescreen_case",
  "booking_support",
  "doctor_followup",
  "order_issue",
  "delivery_issue",
  "customer_support",
  "compliance_review",
]);

function parseParam(
  raw: string | undefined,
  allowed: Set<string>,
  fallback: "all",
): typeof fallback | string {
  if (!raw || raw === "all") return fallback;
  return allowed.has(raw) ? raw : fallback;
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; category?: string; assignee?: string; view?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const statusParam = parseParam(sp.status, STATUSES as Set<string>, "all");
  const categoryParam = parseParam(sp.category, CATEGORIES as Set<string>, "all");
  const assigneeParam =
    sp.assignee === "unassigned" || sp.assignee === "me" ? sp.assignee : "all";
  const viewOpen = sp.view === "open";
  const openOnly = viewOpen && statusParam === "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tickets = await listTicketsForAdmin({
    status: statusParam as TicketStatus | "all",
    category: categoryParam as TicketCategory | "all",
    assignee: assigneeParam as "all" | "unassigned" | "me",
    staffUserId: user?.id,
    openOnly,
  });

  const filterState = {
    status: statusParam,
    category: categoryParam,
    assignee: assigneeParam,
    view: viewOpen ? ("open" as const) : undefined,
  };

  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14">
      <header className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Internal cases: pre-screens, bookings, orders, and patient messages. Filter by status,
            category, and assignment.
          </p>
        </div>
        <AdminOpsExportControls
          kind="tickets"
          params={{
            ...(statusParam !== "all" ? { status: statusParam } : {}),
            ...(categoryParam !== "all" ? { category: categoryParam } : {}),
            ...(assigneeParam !== "all" ? { assignee: assigneeParam } : {}),
            ...(viewOpen ? { view: "open" } : {}),
          }}
        />
      </header>

      <AdminTicketFilters basePath="/admin/tickets" current={filterState} />

      <TicketListTable tickets={tickets} detailHref={(id) => `/admin/tickets/${id}`} />
    </div>
  );
}
