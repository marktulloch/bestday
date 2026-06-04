/**
 * Analytics hooks for prescreen funnel. Safe to call from Client Components.
 * Wires: CustomEvent `bestday:analytics`, optional `window.dataLayer` (GTM).
 */

export type PrescreenAnalyticsPayload = Record<string, unknown>;

export function trackPrescreenEvent(
  event: string,
  payload?: PrescreenAnalyticsPayload,
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("bestday:analytics", {
      detail: { event, payload: payload ?? {}, ts: Date.now() },
    }),
  );

  const w = window as unknown as { dataLayer?: object[] };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({
      event: `bestday_${event}`,
      ...payload,
    });
  }
}

/** Server-side no-op placeholder (log pipelines can subscribe later). */
export function trackPrescreenEventServer(
  _event: string,
  _payload?: PrescreenAnalyticsPayload,
): void {}
