/**
 * Minimal shapes for exercising `reconcileCalendlyWebhook` locally via
 * POST /api/dev/calendly-webhook-test (development only).
 * Replace URIs and emails with values that match your Supabase test user.
 */
export const SAMPLE_INVITEE_CREATED = {
  event: "invitee.created",
  payload: {
    uri: "https://api.calendly.com/scheduled_events/GUID/invitees/GUID",
    email: "patient@example.com",
    name: "Test Patient",
    scheduled_event: {
      uri: "https://api.calendly.com/scheduled_events/GUID",
      start_time: new Date(Date.now() + 86400000).toISOString(),
      end_time: new Date(Date.now() + 86400000 + 30 * 60000).toISOString(),
      timezone: "Pacific/Auckland",
      event_type: {
        uri: "https://api.calendly.com/event_types/GUID",
        name: "Initial consultation",
      },
      location: { type: "custom", join_url: "https://example.com/join" },
    },
  },
} as const;

export const SAMPLE_INVITEE_CANCELED = {
  event: "invitee.canceled",
  payload: {
    uri: "https://api.calendly.com/scheduled_events/GUID/invitees/GUID",
    email: "patient@example.com",
    scheduled_event: {
      uri: "https://api.calendly.com/scheduled_events/GUID",
    },
    cancel_reason: "Test cancel",
    canceled_at: new Date().toISOString(),
    rescheduled: false,
  },
} as const;
