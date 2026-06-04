import "server-only";

import { google } from "googleapis";

import { getWorkspaceJwtClient } from "./auth";
import { GOOGLE_SCOPES } from "./config";

export type CalendarEventSummary = {
  id: string;
  summary: string | null;
  htmlLink: string | null;
  start: string | null;
  end: string | null;
  status: string | null;
};

export type CalendarGetEventResult =
  | { ok: true; event: CalendarEventSummary }
  | { ok: false; error: string };

/**
 * Read a single event for admin/doctor scheduling reference.
 * `calendarId` is often `primary` for the delegated user, or a shared calendar id.
 * Aligns with optional `appointments.google_calendar_event_id` from Calendly sync.
 */
export async function getCalendarEventReference(input: {
  calendarId: string;
  eventId: string;
}): Promise<CalendarGetEventResult> {
  const auth = getWorkspaceJwtClient([GOOGLE_SCOPES.calendarRead]);
  if (!auth) {
    return { ok: false, error: "Google service account credentials are not configured." };
  }

  const cal = google.calendar({ version: "v3", auth });

  try {
    const res = await cal.events.get({
      calendarId: input.calendarId,
      eventId: input.eventId,
    });
    const ev = res.data;
    const start =
      ev.start?.dateTime ?? ev.start?.date ?? null;
    const end = ev.end?.dateTime ?? ev.end?.date ?? null;
    return {
      ok: true,
      event: {
        id: ev.id ?? input.eventId,
        summary: ev.summary ?? null,
        htmlLink: ev.htmlLink ?? null,
        start,
        end,
        status: ev.status ?? null,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Placeholder for future flows: create/update clinic events when appointments confirm.
 * Not wired to routes yet — keep Calendly + DB as source of truth.
 */
export async function createCalendarEventPlaceholder(): Promise<never> {
  throw new Error(
    "createCalendarEvent is not implemented. Use Calendly webhooks + DB appointments; add Calendar writes when product requires it.",
  );
}
