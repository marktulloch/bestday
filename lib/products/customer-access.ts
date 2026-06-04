/**
 * Customer product access is enforced in Postgres RLS on `public.products` (policy
 * `products_select_customer_portal`) using:
 * - `portal_visibility`: none | eligible_only | approved_only | eligible_or_approved
 * - Prescreen workflow: at least one `prescreens` row with `eligible_for_booking` for the customer
 * - Optional row in `customer_product_approvals` with status `approved`
 *
 * Application layer: use `getPortalProducts` / `getPortalProductBySlug` with the patient session;
 * the query results are already filtered by RLS.
 *
 * Staff (master/admin/doctor) use `getAdminProducts` or direct `products` SELECT — separate policies.
 */

export { getPortalProducts, getPortalProductBySlug } from "@/lib/products/queries";
