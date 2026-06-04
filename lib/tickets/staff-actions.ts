"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import type { Json, TicketCategory, TicketCommentVisibility, TicketStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const statusEnum = z.enum([
  "new",
  "in_progress",
  "waiting_on_customer",
  "waiting_on_doctor",
  "resolved",
  "closed",
]);

const categoryEnum = z.enum([
  "prescreen_case",
  "booking_support",
  "doctor_followup",
  "order_issue",
  "delivery_issue",
  "customer_support",
  "compliance_review",
]);

const visibilityEnum = z.enum(["internal", "external"]);

function revalidateTicketPaths(ticketId: string) {
  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/doctor/tickets");
  revalidatePath(`/doctor/tickets/${ticketId}`);
  revalidatePath("/portal/tickets");
  revalidatePath(`/portal/tickets/${ticketId}`);
}

export async function staffUpdateTicket(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const assigneeRaw = formData.get("assignedToUserId");
  let assignee: string | null = null;
  if (assigneeRaw && assigneeRaw !== "unassigned") {
    const p = z.string().uuid().safeParse(assigneeRaw);
    if (p.success) assignee = p.data;
  }

  const parsed = z
    .object({
      ticketId: uuid,
      status: statusEnum,
      category: categoryEnum,
      priority: z.enum(["low", "normal", "high", "urgent"]),
    })
    .safeParse({
      ticketId: formData.get("ticketId"),
      status: formData.get("status"),
      category: formData.get("category"),
      priority: formData.get("priority"),
    });
  if (!parsed.success) return;

  const now = new Date().toISOString();
  const { data: before } = await looseDb(supabase)
    .from("tickets")
    .select("status, category, priority, assigned_to_user_id")
    .eq("id", parsed.data.ticketId)
    .maybeSingle();

  await looseDb(supabase)
    .from("tickets")
    .update({
      status: parsed.data.status,
      category: parsed.data.category,
      priority: parsed.data.priority,
      assigned_to_user_id: assignee,
      updated_at: now,
    })
    .eq("id", parsed.data.ticketId);

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.ticket_updated_staff,
    entityType: "ticket",
    entityId: parsed.data.ticketId,
    metadata: {
      before: before ?? null,
      after: {
        status: parsed.data.status,
        category: parsed.data.category,
        priority: parsed.data.priority,
        assigned_to_user_id: assignee,
      },
    } as Json,
  });

  revalidateTicketPaths(parsed.data.ticketId);
}

export async function staffAddTicketComment(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin", "doctor"], { forbiddenRedirect: "/portal" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = z
    .object({
      ticketId: uuid,
      body: z.string().trim().min(1).max(8000),
      visibility: visibilityEnum,
    })
    .safeParse({
      ticketId: formData.get("ticketId"),
      body: formData.get("body"),
      visibility: formData.get("visibility") ?? "internal",
    });
  if (!parsed.success) return;

  await looseDb(supabase).from("ticket_comments").insert({
    ticket_id: parsed.data.ticketId,
    author_user_id: user.id,
    body: parsed.data.body,
    visibility: parsed.data.visibility as TicketCommentVisibility,
  });

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.ticket_comment_added,
    entityType: "ticket",
    entityId: parsed.data.ticketId,
    metadata: { visibility: parsed.data.visibility } as Json,
  });

  revalidateTicketPaths(parsed.data.ticketId);
}
