import type { TicketCategory, TicketStatus } from "@/lib/database.types";

export function ticketStatusLabel(s: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    new: "New",
    in_progress: "In progress",
    waiting_on_customer: "Waiting on customer",
    waiting_on_doctor: "Waiting on doctor",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[s] ?? s;
}

export function ticketCategoryLabel(c: TicketCategory): string {
  const map: Record<TicketCategory, string> = {
    prescreen_case: "Pre-screen",
    booking_support: "Booking support",
    doctor_followup: "Doctor follow-up",
    order_issue: "Order issue",
    delivery_issue: "Delivery issue",
    customer_support: "Customer support",
    compliance_review: "Compliance review",
  };
  return map[c] ?? c;
}
