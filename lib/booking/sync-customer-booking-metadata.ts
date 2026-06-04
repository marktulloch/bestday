import type { AppointmentRow, Json } from "@/lib/database.types";

function asObject(j: Json): Record<string, unknown> {
  if (j && typeof j === "object" && !Array.isArray(j)) {
    return { ...(j as Record<string, unknown>) };
  }
  return {};
}

function asBookingSection(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { ...(v as Record<string, unknown>) };
  }
  return {};
}

/**
 * Merges lightweight booking pointers into customers.metadata for profile/dashboard use.
 */
export function mergeCustomerBookingMetadata(
  existingMetadata: Json,
  patch: Record<string, unknown>,
): Json {
  const root = asObject(existingMetadata);
  const booking = asBookingSection(root.booking);
  return {
    ...root,
    booking: {
      ...booking,
      ...patch,
      last_synced_at: new Date().toISOString(),
    },
  } as Json;
}

export function bookingMetadataPatchFromAppointment(
  row: Pick<AppointmentRow, "id" | "start_time" | "status" | "calendly_event_uri">,
): Record<string, unknown> {
  return {
    upcoming_appointment_id: row.id,
    upcoming_starts_at: row.start_time,
    upcoming_status: row.status,
    calendly_event_uri: row.calendly_event_uri,
  };
}

export function clearUpcomingBookingMetadata(existingMetadata: Json): Json {
  const root = asObject(existingMetadata);
  const booking = asBookingSection(root.booking);
  const {
    upcoming_appointment_id: _a,
    upcoming_starts_at: _b,
    upcoming_status: _c,
    calendly_event_uri: _d,
    ...rest
  } = booking;
  return {
    ...root,
    booking: {
      ...rest,
      last_synced_at: new Date().toISOString(),
    },
  } as Json;
}
