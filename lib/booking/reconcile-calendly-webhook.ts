import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import type { AppointmentRow, AppointmentStatus, Json } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

import {
  bookingMetadataPatchFromAppointment,
  clearUpcomingBookingMetadata,
  mergeCustomerBookingMetadata,
} from "./sync-customer-booking-metadata";
import { matchCalendlyInviteeToUser, normalizeCalendlyEmail } from "./match-calendly-invitee";
import {
  onAppointmentBooked,
  onAppointmentCancelled,
  onAppointmentCompleted,
  onAppointmentNoShow,
  onAppointmentRescheduled,
} from "./reminder-hooks";

type AdminClient = SupabaseClient<Database>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function getStr(r: Record<string, unknown> | null, key: string): string | null {
  if (!r) return null;
  const v = r[key];
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function getScheduledEvent(payload: Record<string, unknown>): Record<string, unknown> | null {
  const se = payload.scheduled_event;
  return isRecord(se) ? se : null;
}

function extractGoogleCalendarEventId(se: Record<string, unknown> | null): string | null {
  if (!se) return null;
  const keys = [
    "google_calendar_event_id",
    "external_id",
    "calendar_event_external_id",
    "calendar_event_id",
  ] as const;
  for (const k of keys) {
    const v = se[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function extractLocation(
  se: Record<string, unknown> | null,
): { location_type: string | null; location_join_url: string | null } {
  if (!se) return { location_type: null, location_join_url: null };
  const loc = se.location;
  if (!isRecord(loc)) return { location_type: null, location_join_url: null };
  const locationType = getStr(loc, "type");
  const join =
    getStr(loc, "join_url") ??
    (typeof loc.join_url === "string" && loc.join_url.length > 0 ? loc.join_url : null) ??
    getStr(loc, "location");
  return { location_type: locationType, location_join_url: join };
}

function extractEventTypeUriAndName(
  se: Record<string, unknown> | null,
): { calendly_event_type_uri: string | null; calendly_event_type_name: string | null } {
  if (!se) return { calendly_event_type_uri: null, calendly_event_type_name: null };
  const et = se.event_type;
  if (isRecord(et)) {
    const uri = typeof et.uri === "string" && et.uri.length > 0 ? et.uri : null;
    const name = typeof et.name === "string" && et.name.length > 0 ? et.name : null;
    return { calendly_event_type_uri: uri, calendly_event_type_name: name };
  }
  if (typeof et === "string" && et.length > 0) {
    return { calendly_event_type_uri: et, calendly_event_type_name: null };
  }
  const nameOnly = getStr(se, "event_type_name");
  return { calendly_event_type_uri: null, calendly_event_type_name: nameOnly };
}

function buildInviteeName(payload: Record<string, unknown>): string | null {
  const direct = getStr(payload, "name");
  if (direct) return direct;
  const fn = getStr(payload, "first_name");
  const ln = getStr(payload, "last_name");
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  return combined.length > 0 ? combined : null;
}

async function resolveCustomerId(admin: AdminClient, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const { data: customer } = await admin
    .from("customers")
    .select("id, metadata")
    .eq("user_id", userId)
    .maybeSingle();
  return customer?.id ?? null;
}

async function latestEligiblePrescreenId(
  admin: AdminClient,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin
    .from("prescreens")
    .select("id")
    .eq("user_id", userId)
    .eq("workflow_status", "eligible_for_booking")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncCustomerMetadataForActiveBooking(
  admin: AdminClient,
  customerId: string,
  row: {
    id: string;
    start_time: string | null;
    status: AppointmentStatus;
    calendly_event_uri: string | null;
  },
): Promise<void> {
  const { data: customer } = await admin
    .from("customers")
    .select("metadata")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return;

  const nextMeta = mergeCustomerBookingMetadata(
    customer.metadata as Json,
    bookingMetadataPatchFromAppointment(row),
  );

  await admin
    .from("customers")
    .update({ metadata: nextMeta, updated_at: new Date().toISOString() })
    .eq("id", customerId);
}

async function findAppointmentForCancel(
  admin: AdminClient,
  invUri: string | null,
  evUri: string | null,
  inviteeEmail: string | null,
) {
  if (invUri) {
    const { data } = await admin
      .from("appointments")
      .select("*")
      .eq("calendly_invitee_uri", invUri)
      .maybeSingle();
    if (data) return data;
  }
  if (evUri && inviteeEmail) {
    const { data } = await admin
      .from("appointments")
      .select("*")
      .eq("calendly_event_uri", evUri)
      .eq("invitee_email", inviteeEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

async function clearCustomerUpcomingIfMatch(
  admin: AdminClient,
  customerId: string,
  appointmentId: string,
): Promise<void> {
  const { data: customer } = await admin
    .from("customers")
    .select("metadata")
    .eq("id", customerId)
    .maybeSingle();
  if (!customer) return;

  const meta = customer.metadata as Record<string, unknown> | null;
  const booking = meta?.booking as Record<string, unknown> | undefined;
  if (booking?.upcoming_appointment_id === appointmentId) {
    const nextMeta = clearUpcomingBookingMetadata(customer.metadata as Json);
    await admin
      .from("customers")
      .update({ metadata: nextMeta, updated_at: new Date().toISOString() })
      .eq("id", customerId);
  }
}

async function auditCalendlySync(
  appointmentId: string | null,
  calendlyEvent: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await logAuditEvent({
    actorId: null,
    action: AUDIT_ACTION.booking_calendly_sync,
    entityType: "appointment",
    entityId: appointmentId,
    metadata: { calendly_event: calendlyEvent, ...extra } as Json,
  });
}

export async function reconcileCalendlyWebhook(
  admin: AdminClient,
  body: unknown,
): Promise<{ handled: boolean; detail: string }> {
  if (!isRecord(body)) {
    return { handled: false, detail: "invalid_body" };
  }

  const eventRaw = body.event;
  const event = typeof eventRaw === "string" ? eventRaw.toLowerCase().trim() : "";
  const payload = isRecord(body.payload) ? body.payload : null;
  if (!payload) {
    return { handled: false, detail: "missing_payload" };
  }

  const scheduledEvent = getScheduledEvent(payload);
  const eventUri =
    typeof scheduledEvent?.uri === "string" ? scheduledEvent.uri : null;
  const inviteeUri = typeof payload.uri === "string" ? payload.uri : null;
  const startTime =
    typeof scheduledEvent?.start_time === "string" ? scheduledEvent.start_time : null;
  const endTime =
    typeof scheduledEvent?.end_time === "string" ? scheduledEvent.end_time : null;
  const timezone =
    typeof scheduledEvent?.timezone === "string"
      ? scheduledEvent.timezone
      : typeof payload.timezone === "string"
        ? payload.timezone
        : null;

  const inviteeEmail = normalizeCalendlyEmail(payload.email);
  const inviteeName = buildInviteeName(payload);
  const { location_type, location_join_url } = extractLocation(scheduledEvent);
  const { calendly_event_type_uri, calendly_event_type_name } =
    extractEventTypeUriAndName(scheduledEvent);

  const googleRef = extractGoogleCalendarEventId(scheduledEvent);
  const now = new Date().toISOString();

  const metadata: Json = body as unknown as Json;

  if (event === "invitee.created") {
    if (!startTime || !inviteeUri) {
      return { handled: false, detail: "invitee.created_incomplete" };
    }

    const rescheduledFlag =
      payload.rescheduled === true || scheduledEvent?.rescheduled === true;
    const oldEventUri = (() => {
      if (isRecord(payload.old_invitee)) {
        const oi = payload.old_invitee as Record<string, unknown>;
        const ose = oi.scheduled_event;
        if (isRecord(ose) && typeof ose.uri === "string") return ose.uri;
      }
      const ose2 = payload.old_scheduled_event;
      if (isRecord(ose2) && typeof ose2.uri === "string") return ose2.uri;
      return null;
    })();

    const userId = await matchCalendlyInviteeToUser(admin, inviteeEmail ?? payload.email);
    const customerId = await resolveCustomerId(admin, userId);
    const prescreenId = await latestEligiblePrescreenId(admin, userId);

    let priorRescheduleRow: AppointmentRow | null = null;

    if (rescheduledFlag && oldEventUri) {
      const { data: beforeUpdate } = await admin
        .from("appointments")
        .select("*")
        .eq("calendly_event_uri", oldEventUri)
        .maybeSingle();
      priorRescheduleRow = (beforeUpdate as AppointmentRow | null) ?? null;
      await admin
        .from("appointments")
        .update({
          status: "rescheduled",
          updated_at: now,
          rescheduled: true,
        })
        .eq("calendly_event_uri", oldEventUri);
    }

    const row = {
      customer_id: customerId,
      user_id: userId,
      prescreen_id: prescreenId,
      status: "scheduled" as const,
      start_time: startTime,
      end_time: endTime,
      timezone,
      calendly_event_uri: eventUri,
      calendly_invitee_uri: inviteeUri,
      calendly_event_type_uri,
      calendly_event_type_name,
      invitee_email: inviteeEmail ?? "unlinked@calendly.placeholder",
      invitee_name: inviteeName,
      location_type,
      location_join_url,
      rescheduled: false,
      rescheduled_from_uri: oldEventUri,
      google_calendar_event_id: googleRef,
      raw_payload: metadata,
      source: "calendly",
      updated_at: now,
    };

    const { data: upserted, error } = await admin
      .from("appointments")
      .upsert(row, { onConflict: "calendly_invitee_uri" })
      .select()
      .single();

    if (error || !upserted) {
      return { handled: false, detail: `upsert_error:${error?.message ?? "unknown"}` };
    }

    if (customerId) {
      await syncCustomerMetadataForActiveBooking(admin, customerId, {
        id: upserted.id,
        start_time: upserted.start_time,
        status: upserted.status,
        calendly_event_uri: upserted.calendly_event_uri,
      });
    }

    if (rescheduledFlag && oldEventUri) {
      await onAppointmentRescheduled(admin, priorRescheduleRow, upserted);
    } else {
      await onAppointmentBooked(admin, upserted);
    }

    await auditCalendlySync(upserted.id, event, {
      rescheduled: rescheduledFlag,
      calendly_invitee_uri: inviteeUri,
      calendly_event_uri: eventUri,
    });

    return { handled: true, detail: "invitee.created" };
  }

  if (event === "invitee.canceled") {
    const emailNorm = inviteeEmail ?? normalizeCalendlyEmail(payload.email);
    const cancelledAtRaw =
      getStr(payload, "canceled_at") ??
      getStr(payload, "cancelled_at") ??
      (typeof payload.cancellation === "object" && payload.cancellation !== null
        ? getStr(payload.cancellation as Record<string, unknown>, "canceled_at")
        : null);
    const cancelReason =
      getStr(payload, "cancel_reason") ??
      getStr(payload, "reason") ??
      (typeof payload.cancellation === "object" && payload.cancellation !== null
        ? getStr(payload.cancellation as Record<string, unknown>, "reason")
        : null);
    const rescheduleFromCancellation = payload.rescheduled === true;

    const existing = await findAppointmentForCancel(
      admin,
      inviteeUri,
      eventUri,
      emailNorm,
    );

    if (existing) {
      const nextStatus: AppointmentStatus = rescheduleFromCancellation
        ? "rescheduled"
        : "cancelled";
      const { data: updated, error } = await admin
        .from("appointments")
        .update({
          status: nextStatus,
          cancel_reason: cancelReason,
          cancelled_at: cancelledAtRaw ?? now,
          rescheduled: rescheduleFromCancellation,
          raw_payload: metadata,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error || !updated) {
        return { handled: false, detail: `cancel_update_error:${error?.message}` };
      }

      if (updated.customer_id) {
        await clearCustomerUpcomingIfMatch(admin, updated.customer_id, updated.id);
      }
      await onAppointmentCancelled(admin, updated);
      await auditCalendlySync(updated.id, event, { prior_status: existing.status });
      return { handled: true, detail: "invitee.canceled" };
    }

    const orphanedUserId = await matchCalendlyInviteeToUser(admin, payload.email);
    if (orphanedUserId && emailNorm) {
      const customerId = await resolveCustomerId(admin, orphanedUserId);
      const minimal = {
        user_id: orphanedUserId,
        customer_id: customerId,
        prescreen_id: null,
        status: (rescheduleFromCancellation ? "rescheduled" : "cancelled") as AppointmentStatus,
        start_time: null,
        end_time: null,
        timezone: null,
        calendly_event_uri: eventUri,
        calendly_invitee_uri: inviteeUri,
        calendly_event_type_uri: null,
        calendly_event_type_name: null,
        invitee_email: emailNorm,
        invitee_name: inviteeName,
        location_type: null,
        location_join_url: null,
        cancel_reason: cancelReason,
        cancelled_at: cancelledAtRaw ?? now,
        rescheduled: rescheduleFromCancellation,
        raw_payload: metadata,
        source: "calendly",
        updated_at: now,
      };
      const { error: insErr } = await admin.from("appointments").insert(minimal);
      if (insErr) {
        console.warn("[calendly] cancel minimal insert failed", insErr.message);
      }
      return { handled: true, detail: "invitee.canceled_orphan_insert" };
    }

    console.warn(
      "[calendly] invitee.canceled unmatched — no appointment row and no profile for email",
    );
    return { handled: true, detail: "invitee.canceled_unmatched" };
  }

  if (event.includes("no_show")) {
    if (!inviteeUri && !eventUri) {
      return { handled: false, detail: "no_show_no_uri" };
    }
    const emailNorm = inviteeEmail ?? normalizeCalendlyEmail(payload.email);
    const existing = await findAppointmentForCancel(admin, inviteeUri, eventUri, emailNorm);
    if (!existing) {
      return { handled: true, detail: "no_show_no_row" };
    }
    const { data: updated, error } = await admin
      .from("appointments")
      .update({ status: "no_show", raw_payload: metadata, updated_at: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error || !updated) {
      return { handled: false, detail: "no_show_update_failed" };
    }
    await onAppointmentNoShow(admin, updated);
    await auditCalendlySync(updated.id, event, { prior_status: existing.status });
    return { handled: true, detail: "no_show" };
  }

  if (event.includes("completed")) {
    if (!inviteeUri && !eventUri) {
      return { handled: false, detail: "completed_no_uri" };
    }
    const emailNorm = inviteeEmail ?? normalizeCalendlyEmail(payload.email);
    const existing = await findAppointmentForCancel(admin, inviteeUri, eventUri, emailNorm);
    if (!existing) {
      return { handled: true, detail: "completed_no_row" };
    }
    const { data: updated, error } = await admin
      .from("appointments")
      .update({ status: "completed", raw_payload: metadata, updated_at: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error || !updated) {
      return { handled: false, detail: "completed_update_failed" };
    }
    await onAppointmentCompleted(admin, updated);
    if (updated.customer_id) {
      await clearCustomerUpcomingIfMatch(admin, updated.customer_id, updated.id);
    }
    await auditCalendlySync(updated.id, event, { prior_status: existing.status });
    return { handled: true, detail: "completed" };
  }

  console.info(`[calendly] webhook no-op for event type: ${event || "unknown"}`);
  return { handled: true, detail: `ignored:${event || "unknown"}` };
}
