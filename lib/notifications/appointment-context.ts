import type { AppointmentRow } from "@/lib/database.types";

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "friend";
  const part = fullName.trim().split(/\s+/)[0];
  return part || "friend";
}

function formatAppointmentDate(iso: string, timeZone: string | null | undefined): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timeZone || "Pacific/Auckland",
  }).format(d);
}

function formatAppointmentTime(iso: string, timeZone: string | null | undefined): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone || "Pacific/Auckland",
  }).format(d);
}

function formatAppointmentDateTime(iso: string, timeZone: string | null | undefined): string {
  return `${formatAppointmentDate(iso, timeZone)} at ${formatAppointmentTime(iso, timeZone)}`;
}

export type AppointmentEmailContext = Record<string, string>;

export function buildAppointmentTemplateContext(
  appointment: AppointmentRow,
  profile: { full_name: string | null } | null,
): AppointmentEmailContext {
  const base = siteBaseUrl();
  const tz = appointment.timezone ?? "Pacific/Auckland";
  const patientFirst = firstName(profile?.full_name ?? null);

  return {
    site_name: "Best Day",
    patient_first_name: patientFirst,
    patient_name: profile?.full_name?.trim() || patientFirst,
    appointment_date: formatAppointmentDate(appointment.start_time ?? "", tz),
    appointment_time: formatAppointmentTime(appointment.start_time ?? "", tz),
    appointment_datetime: formatAppointmentDateTime(appointment.start_time ?? "", tz),
    appointment_timezone: tz,
    portal_url: `${base}/portal`,
    booking_url: `${base}/portal/booking`,
  };
}
