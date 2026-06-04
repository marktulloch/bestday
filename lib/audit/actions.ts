/**
 * Canonical audit `action` string values for `audit_logs.action`.
 * Keep stable — used for reporting and alerts.
 */
export const AUDIT_ACTION = {
  role_changed: "role_changed",
  prescreen_workflow_updated: "prescreen_workflow_updated",
  booking_calendly_sync: "booking_calendly_sync",
  consultation_note_created: "consultation_note_created",
  consultation_recommendation_created: "consultation_recommendation_created",
  customer_order_created: "customer_order_created",
  customer_order_status_updated: "customer_order_status_updated",
  customer_product_approval_upserted: "customer_product_approval_upserted",
  purchase_order_status_admin: "purchase_order_status_admin",
  purchase_order_fulfilment_admin: "purchase_order_fulfilment_admin",
  purchase_cart_line_added: "purchase_cart_line_added",
  purchase_order_submitted: "purchase_order_submitted",
  purchase_order_paid_placeholder: "purchase_order_paid_placeholder",
  purchase_order_cancelled_by_patient: "purchase_order_cancelled_by_patient",
  ticket_updated_staff: "ticket_updated_staff",
  ticket_comment_added: "ticket_comment_added",
  ticket_created_portal: "ticket_created_portal",
  customer_record_updated: "customer_record_updated",
  product_created: "product_created",
  product_updated: "product_updated",
  product_deleted: "product_deleted",
  product_category_created: "product_category_created",
  doctor_patient_assigned: "doctor_patient_assigned",
  doctor_patient_unassigned: "doctor_patient_unassigned",
  ops_export: "ops_export",
} as const;

export type AuditActionName = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
