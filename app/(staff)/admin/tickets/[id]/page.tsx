import { notFound } from "next/navigation";

import { StaffTicketWorkspace } from "@/app/components/staff/StaffTicketWorkspace";
import {
  fetchProfileSummariesByIds,
  getTicketByIdForStaff,
  listCommentsForTicketStaff,
  listStaffAssignees,
} from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicketByIdForStaff(id);
  if (!ticket) notFound();

  const [comments, assignees] = await Promise.all([
    listCommentsForTicketStaff(id),
    listStaffAssignees(),
  ]);

  const authorIds = [...new Set(comments.map((c) => c.author_user_id))];
  const authorProfiles = await fetchProfileSummariesByIds(authorIds);

  const assigneeProfile = ticket.assigned_to_user_id
    ? (await fetchProfileSummariesByIds([ticket.assigned_to_user_id])).get(ticket.assigned_to_user_id) ?? null
    : null;

  return (
    <StaffTicketWorkspace
      ticket={ticket}
      comments={comments}
      assignees={assignees}
      authorProfiles={authorProfiles}
      assigneeProfile={assigneeProfile}
      listHref="/admin/tickets"
      listLabel="All tickets"
      isAdminContext
    />
  );
}
