"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AUDIT_ACTION } from "@/lib/audit/actions";
import { logAuditEvent } from "@/lib/audit/server";
import { requireRoles } from "@/lib/auth/guards-server";
import { imageUrlsFromFormData, validateProductImageUrls } from "@/lib/products/image-urls";
import { slugify } from "@/lib/products/slug";
import { createClient } from "@/lib/supabase/server";
import { looseDb } from "@/lib/supabase/loose-client";

const uuid = z.string().uuid();

const catalogueStatus = z.enum(["draft", "active", "archived"]);
const portalVisibility = z.enum(["none", "eligible_only", "approved_only", "eligible_or_approved"]);

const productBase = {
  sku: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(200),
  short_description: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(50000).optional().nullable(),
  dosage_form: z.string().trim().max(200).optional().nullable(),
  strength: z.string().trim().max(200).optional().nullable(),
  usage_instructions: z.string().trim().max(10000).optional().nullable(),
  price_dollars: z.coerce.number().min(0),
  currency: z.string().trim().length(3).default("NZD"),
  catalogue_status: catalogueStatus,
  requires_doctor_approval: z.boolean(),
  public_education: z.boolean(),
  portal_visibility: portalVisibility,
  track_inventory: z.boolean(),
  stock_quantity: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int().min(0).nullable().optional(),
  ),
  category_id: z.preprocess(
    (v) => (v === "" || v === null ? null : v),
    z.string().uuid().nullable().optional(),
  ),
};

const productInsertSchema = z.object({
  ...productBase,
});

const productUpdateSchema = z.object({
  id: uuid,
  ...productBase,
});

type ProductParsedInsert = Omit<z.infer<typeof productInsertSchema>, "price_dollars"> & {
  price_cents: number;
};

type ProductParsedUpdate = Omit<z.infer<typeof productUpdateSchema>, "price_dollars"> & {
  price_cents: number;
};

function parseProductForm(
  formData: FormData,
  mode: "insert" | "update",
): z.ZodError | { ok: true; data: ProductParsedInsert | ProductParsedUpdate } {
  const raw = {
    id: formData.get("id") || undefined,
    sku: formData.get("sku"),
    slug: formData.get("slug") || undefined,
    name: formData.get("name"),
    short_description: formData.get("short_description") || null,
    description: formData.get("description") || null,
    dosage_form: formData.get("dosage_form") || null,
    strength: formData.get("strength") || null,
    usage_instructions: formData.get("usage_instructions") || null,
    price_dollars: formData.get("price_dollars"),
    currency: formData.get("currency") || "NZD",
    catalogue_status: formData.get("catalogue_status"),
    requires_doctor_approval: formData.get("requires_doctor_approval") === "on",
    public_education: formData.get("public_education") === "on",
    portal_visibility: formData.get("portal_visibility"),
    track_inventory: formData.get("track_inventory") === "on",
    stock_quantity: formData.get("stock_quantity"),
    category_id: formData.get("category_id"),
  };

  const slugFinal =
    (typeof raw.slug === "string" && raw.slug.trim() !== "" ? raw.slug.trim() : null) ??
    slugify(String(raw.name ?? ""));

  const withSlug = { ...raw, slug: slugFinal };

  const parsedBase =
    mode === "update" ? productUpdateSchema.safeParse(withSlug) : productInsertSchema.safeParse(withSlug);
  if (!parsedBase.success) return parsedBase.error;

  const price_cents = Math.round(parsedBase.data.price_dollars * 100);
  const { price_dollars: _, ...rest } = parsedBase.data;
  return { ok: true as const, data: { ...rest, price_cents } };
}

export async function createProduct(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const parsed = parseProductForm(formData, "insert");
  if (!("ok" in parsed)) {
    return { ok: false, error: parsed.flatten().formErrors.join(" ") };
  }

  const image_urls = imageUrlsFromFormData(formData);
  const imageErr = validateProductImageUrls(image_urls);
  if (imageErr) return { ok: false, error: imageErr };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const now = new Date().toISOString();
  const row = {
    ...parsed.data,
    metadata: { image_urls },
    updated_at: now,
  };

  const { data: inserted, error } = await looseDb(supabase)
    .from("products")
    .insert(row)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.product_created,
    entityType: "product",
    entityId: inserted?.id ?? null,
    metadata: { sku: parsed.data.sku },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/portal/products");
  return { ok: true };
}

export async function updateProduct(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const parsed = parseProductForm(formData, "update");
  if (!("ok" in parsed)) {
    return { ok: false, error: parsed.flatten().formErrors.join(" ") };
  }

  const image_urls = imageUrlsFromFormData(formData);
  const imageErr = validateProductImageUrls(image_urls);
  if (imageErr) return { ok: false, error: imageErr };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const row = parsed.data;
  if (!("id" in row)) {
    return { ok: false, error: "Missing product id" };
  }
  const { id, ...rest } = row;
  const now = new Date().toISOString();

  const { data: existing, error: metaFetchErr } = await looseDb(supabase)
    .from("products")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();

  if (metaFetchErr) return { ok: false, error: metaFetchErr.message };

  const prevMeta =
    existing?.metadata &&
    typeof existing.metadata === "object" &&
    !Array.isArray(existing.metadata)
      ? { ...(existing.metadata as Record<string, unknown>) }
      : {};
  const metadata = { ...prevMeta, image_urls };

  const { error } = await looseDb(supabase)
    .from("products")
    .update({ ...rest, metadata, updated_at: now })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.product_updated,
    entityType: "product",
    entityId: id,
    metadata: { sku: parsed.data.sku },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/products");
  revalidatePath("/portal/products");
  revalidatePath(`/products/${parsed.data.slug}`);
  revalidatePath(`/portal/products/${parsed.data.slug}`);
  return { ok: true };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const idParse = uuid.safeParse(formData.get("id"));
  if (!idParse.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await looseDb(supabase).from("products").delete().eq("id", idParse.data);

  if (error) return;

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.product_deleted,
    entityType: "product",
    entityId: idParse.data,
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/portal/products");
}

const categorySchema = z.object({
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean(),
});

export async function createCategory(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireRoles(["master", "admin"], { forbiddenRedirect: "/portal" });

  const parsed = categorySchema.safeParse({
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    name: formData.get("name"),
    description: formData.get("description") || null,
    sort_order: formData.get("sort_order") ?? 0,
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join(" ") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const now = new Date().toISOString();
  const { error } = await looseDb(supabase).from("product_categories").insert({
    ...parsed.data,
    slug: slugify(parsed.data.slug),
    created_at: now,
    updated_at: now,
  });

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actorId: user.id,
    action: AUDIT_ACTION.product_category_created,
    entityType: "product_category",
    entityId: null,
    metadata: { slug: parsed.data.slug },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/categories");
  return { ok: true };
}
