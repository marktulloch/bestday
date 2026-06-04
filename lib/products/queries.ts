import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";
import type { ProductCategoryRow, ProductRow } from "@/lib/database.types";

export type ProductWithCategory = ProductRow & {
  category: ProductCategoryRow | null;
};

const productSelect = `
  *,
  category:product_categories (*)
`;

export async function getEducationalProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("catalogue_status", "active")
    .eq("public_education", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as ProductWithCategory[];
}

export async function getEducationalProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("catalogue_status", "active")
    .eq("public_education", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductWithCategory;
}

/** Portal / patient catalogue — RLS enforces eligibility and approvals. */
export async function getPortalProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("products")
    .select(productSelect)
    .eq("catalogue_status", "active")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as ProductWithCategory[];
}

export async function getPortalProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("catalogue_status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductWithCategory;
}

/** Admin catalogue (drafts included). */
export async function getAdminProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as ProductWithCategory[];
}

export async function getAdminProductById(id: string): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductWithCategory;
}

export async function getAdminCategories(): Promise<ProductCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as ProductCategoryRow[];
}

/** Staff pick-lists (e.g. grant access on a patient). */
export async function getActiveProductsForStaff(): Promise<Pick<ProductRow, "id" | "name" | "sku">[]> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("products")
    .select("id, name, sku")
    .eq("catalogue_status", "active")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as Pick<ProductRow, "id" | "name" | "sku">[];
}

export type ProductApprovalListRow = {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  approved_at: string | null;
  notes: string | null;
  updated_at: string;
  customer: { id: string; user_id: string } | null;
  product: { id: string; name: string; sku: string } | null;
};

export async function getAdminProductApprovals(): Promise<ProductApprovalListRow[]> {
  const supabase = await createClient();
  const { data, error } = await looseDb(supabase)
    .from("customer_product_approvals")
    .select(
      `
      id,
      customer_id,
      product_id,
      status,
      approved_at,
      notes,
      updated_at,
      customer:customers ( id, user_id ),
      product:products ( id, name, sku )
    `,
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data as ProductApprovalListRow[];
}
