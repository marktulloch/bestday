/** Display price from minor units (e.g. cents). */
export function formatPrice(cents: number, currency: string = "NZD"): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: currency.length === 3 ? currency : "NZD",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
