/** Keys matching notification_templates.template_key (add SMS rows with same keys later). */
export const NOTIFICATION_TEMPLATE_KEYS = [
  "booking_confirmation",
  "reminder_24h",
  "reminder_2h",
  "no_show_followup",
  "rebooking_prompt",
] as const;

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number];
