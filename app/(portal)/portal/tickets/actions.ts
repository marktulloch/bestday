"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { getAuthContext } from "@/lib/auth/session";
import type { TicketCategory } from "@/lib/database.types";
import { getCustomerIdForUser, getPurchaseOrderForCustomer } from "@/lib/orders/purchase-queries";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const customerCategoryEnum = z.enum([
  "booking_support",
  "order_issue",
  "delivery_issue",
  "customer_support",
]);

async function requireCustomerId(): Promise<{ ok: true; customerId: string; userId: string } | { ok: false }> {
  const ctx = await getAuthContext();
  if (!ctx || ctx.profile.role !== "customer") return { ok: false };
  const customerId = await getCustomerIdForUser(ctx.user.id);
  if (!customerId) return { ok: false };
  return { ok: true, customerId, userId: ctx.user.id };
}

export async function createCustomerSupportTicket(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireCustomerId();
  if (!gate.ok) return { ok: false, error: "Sign in as a patient to open a ticket." };

  const poRaw = formData.get("purchaseOrderId");
  const purchaseOrderIdParsed =
    typeof poRaw === "string" && poRaw.length > 0 ? poRaw : null;

  const parsed = z
    .object({
      category: customerCategoryEnum,
      subject: z.string().trim().min(3).max(200),
      message: z.string().trim().min(1).max(8000),
      purchaseOrderId: z.string().uuid().nullable(),
    })
    .safeParse({
      category: formData.get("category"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      purchaseOrderId: purchaseOrderIdParsed,
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  let purchaseOrderId: string | null = parsed.data.purchaseOrderId ?? null;
  if (parsed.data.category === "order_issue" || parsed.data.category === "delivery_issue") {
    if (!purchaseOrderId) {
      return { ok: false, error: "Please choose the order this relates to." };
    }
    const order = await getPurchaseOrderForCustomer(gate.customerId, purchaseOrderId);
    if (!order) {
      return { ok: false, error: "Order not found." };
    }
  } else {
    purchaseOrderId = null;
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: ticket, error: tErr } = await looseDb(supabase)
    .from("tickets")
    .insert({
      customer_id: gate.customerId,
      created_by_user_id: gate.userId,
      subject: parsed.data.subject,
      status: "new",
      priority: "normal",
      category: parsed.data.category as TicketCategory,
      purchase_order_id: purchaseOrderId,
      metadata: { source: "portal" },
      updated_at: now,
    })
    .select("id")
    .single();

  if (tErr || !ticket) {
    return { ok: false, error: tErr?.message ?? "Could not create ticket." };
  }

  const ticketId = (ticket as { id: string }).id;

  await logAuditEvent({
    actorId: gate.userId,
    action: AUDIT_ACTION.ticket_created_portal,
    entityType: "ticket",
    entityId: ticketId,
    metadata: {
      category: parsed.data.category,
      subject_length: parsed.data.subject.length,
      has_purchase_order: Boolean(purchaseOrderId),
    },
  });

  const { error: cErr } = await looseDb(supabase).from("ticket_comments").insert({
    ticket_id: ticketId,
    author_user_id: gate.userId,
    body: parsed.data.message,
    visibility: "external",
  });

  if (cErr) {
    return { ok: false, error: cErr.message };
  }

  revalidatePath("/portal/tickets");
  revalidatePath("/portal");
  redirect(`/portal/tickets/${ticketId}`);
}

export async function customerAddTicketCommentForm(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return customerAddTicketComment(formData);
}

export async function customerAddTicketComment(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireCustomerId();
  if (!gate.ok) return { ok: false, error: "Not signed in." };

  const parsed = z
    .object({
      ticketId: uuid,
      body: z.string().trim().min(1).max(8000),
    })
    .safeParse({
      ticketId: formData.get("ticketId"),
      body: formData.get("body"),
    });
  if (!parsed.success) return { ok: false, error: "Invalid message." };

  const supabase = await createClient();
  const { data: ticket } = await looseDb(supabase)
    .from("tickets")
    .select("id")
    .eq("id", parsed.data.ticketId)
    .eq("customer_id", gate.customerId)
    .maybeSingle();

  if (!ticket) return { ok: false, error: "Ticket not found." };

  const { error } = await looseDb(supabase).from("ticket_comments").insert({
    ticket_id: parsed.data.ticketId,
    author_user_id: gate.userId,
    body: parsed.data.body,
    visibility: "external",
  });

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: gate.userId,
    action: AUDIT_ACTION.ticket_comment_added,
    entityType: "ticket",
    entityId: parsed.data.ticketId,
    metadata: { channel: "portal", visibility: "external" },
  });

  revalidatePath(`/portal/tickets/${parsed.data.ticketId}`);
  revalidatePath("/portal/tickets");
  return { ok: true };
}
