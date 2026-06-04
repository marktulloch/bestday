import type { PurchaseDeliveryStatus, PurchaseOrderStatus } from "@/lib/database.types";

export type OrderTimelineStep = {
  key: string;
  label: string;
  detail?: string;
  done: boolean;
  current: boolean;
};

const ORDER_RANK: Record<Exclude<PurchaseOrderStatus, "cancelled">, number> = {
  draft: 0,
  awaiting_payment: 1,
  paid: 2,
  awaiting_fulfilment: 3,
  packed: 4,
  dispatched: 5,
  delivered: 6,
};

function rank(status: PurchaseOrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_RANK[status];
}

export function purchaseDeliveryStatusLabel(s: PurchaseDeliveryStatus): string {
  const map: Record<PurchaseDeliveryStatus, string> = {
    pending: "Pending",
    awaiting_pickup: "Awaiting pickup",
    in_transit: "In transit",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    exception: "Needs attention",
  };
  return map[s] ?? s;
}

/**
 * High-trust progress ladder: order workflow plus parcel status when relevant.
 */
export function buildOrderTimeline(input: {
  orderStatus: PurchaseOrderStatus;
  placedAt: string | null;
  deliveryStatus: PurchaseDeliveryStatus | null;
  dispatchedAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
}): OrderTimelineStep[] {
  const { orderStatus, placedAt, deliveryStatus, dispatchedAt, courier, trackingNumber } = input;

  if (orderStatus === "cancelled") {
    return [
      {
        key: "cancelled",
        label: "Order cancelled",
        detail: placedAt ? `Placed ${formatShortDate(placedAt)}` : undefined,
        done: true,
        current: true,
      },
    ];
  }

  const r = rank(orderStatus);
  const d = deliveryStatus ?? "pending";

  const dispatchDetail = [
    dispatchedAt ? `Dispatched ${formatShortDate(dispatchedAt)}` : null,
    courier ? courier : null,
    trackingNumber ? `Tracking: ${trackingNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const parcelLine = d !== "pending" ? purchaseDeliveryStatusLabel(d) : undefined;

  const raw: Omit<OrderTimelineStep, "current">[] = [
    {
      key: "placed",
      label: "Order placed",
      detail: placedAt ? formatShortDate(placedAt) : undefined,
      done: r >= 1,
    },
    {
      key: "paid",
      label: "Payment received",
      done: r >= 2,
    },
    {
      key: "fulfilment",
      label: "Preparing your order",
      done: r >= 3,
    },
    {
      key: "packed",
      label: "Packed",
      done: r >= 4,
    },
    {
      key: "dispatched",
      label: "Dispatched",
      detail: [dispatchDetail, parcelLine].filter(Boolean).join(" · ") || undefined,
      done: r >= 5 || Boolean(dispatchedAt) || d === "awaiting_pickup",
    },
    {
      key: "delivered",
      label: "Delivered",
      done: r >= 6 || d === "delivered",
    },
  ];

  const firstOpen = raw.findIndex((s) => !s.done);
  const currentIndex = firstOpen === -1 ? raw.length - 1 : firstOpen;

  return raw.map((s, i) => ({
    ...s,
    current: i === currentIndex,
  }));
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-NZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
