import type { Json } from "@/lib/database.types";

/**
 * Placeholder for future carrier integrations (tracking webhooks, label purchase, etc.).
 * Store carrier-specific ids and URLs in `purchase_order_fulfilment.courier_metadata`.
 */
export type CourierShipmentRef = {
  provider: string;
  externalShipmentId?: string;
  labelUrl?: string;
  raw?: Json;
};

export function parseCourierMetadata(raw: Json): CourierShipmentRef | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const provider = o.provider;
  if (typeof provider !== "string" || !provider.trim()) return null;
  return {
    provider,
    externalShipmentId: typeof o.externalShipmentId === "string" ? o.externalShipmentId : undefined,
    labelUrl: typeof o.labelUrl === "string" ? o.labelUrl : undefined,
    raw,
  };
}
