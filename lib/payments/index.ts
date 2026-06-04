import type { PaymentCaptureResult, PaymentPrepareResult } from "@/lib/payments/types";
import type { PurchaseOrderRow } from "@/lib/database.types";

/**
 * Placeholder payment layer. Swap `capturePlaceholderPayment` for a Stripe-backed
 * implementation without changing order status enums.
 */
export async function preparePaymentForOrder(
  _order: Pick<PurchaseOrderRow, "id" | "total_cents" | "currency" | "status">,
): Promise<PaymentPrepareResult> {
  return { ok: true, provider: "placeholder", deferred: true };
}

/**
 * Simulates a successful charge (e.g. after Stripe confirms). Call only from trusted server code.
 */
export async function capturePlaceholderPayment(
  order: Pick<PurchaseOrderRow, "id" | "status">,
): Promise<PaymentCaptureResult> {
  if (order.status !== "awaiting_payment") {
    return { ok: false, message: "Order is not awaiting payment." };
  }
  const reference = `placeholder_${order.id.slice(0, 8)}_${Date.now()}`;
  return { ok: true, reference, provider: "placeholder" };
}
