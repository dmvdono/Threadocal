"use client";

import { demoProducts } from "@/lib/demo/marketplace";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { getCurrentProfile } from "@/services/auth";
import type { BrandCoupon, BrandInventoryVariant, BrandPortalProduct, ProductCategory } from "@/types/product";
import type { Database } from "@/types/supabase";

const BRAND_PRODUCTS_STORAGE_KEY = "threadocal-demo-brand-products";
const BRAND_COUPONS_STORAGE_KEY = "threadocal-demo-brand-coupons";
export const BRAND_PORTAL_UPDATED_EVENT = "threadocal-brand-portal-updated";
export const STANDARD_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
export const STANDARD_COLOR_OPTIONS = [
  "Black",
  "White",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Pink",
  "Purple",
  "Yellow",
];
const IMAGE_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const BRAND_LOGO_BUCKET = "brand-logos";
const BRAND_BANNER_BUCKET = "brand-banners";
const PRODUCT_IMAGE_BUCKET = "product-images";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const MARKETPLACE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function validateImageFile(file: File, maxBytes: number) {
  const extension = getFileExtension(file);

  if (!IMAGE_EXTENSIONS.includes(extension) || !IMAGE_FILE_TYPES.includes(file.type)) {
    throw new Error("Upload a JPG, JPEG, PNG, or WEBP image.");
  }

  if (file.size > maxBytes) {
    throw new Error(`Image must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller.`);
  }
}

function createStoragePath(ownerId: string, file: File) {
  const extension = getFileExtension(file);
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48) || "image";

  return `${ownerId}/${Date.now()}-${safeName}.${extension}`;
}

async function uploadMarketplaceImage(bucket: string, file: File, maxBytes: number) {
  validateImageFile(file, maxBytes);

  const brand = await ensureOwnerBrand();

  if (!brand) {
    throw new Error("Sign in as a brand owner before uploading images.");
  }

  const supabase = createBrowserSupabaseClient();
  const path = createStoragePath(brand.id, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { brand, url: data.publicUrl };
}

function createInventory(sizes: string[], colors: string[], baseQuantity: number): BrandInventoryVariant[] {
  const safeSizes = sizes.length > 0 ? sizes : ["OS"];
  const safeColors = colors.length > 0 ? colors : ["Default"];

  return safeSizes.flatMap((size) =>
    safeColors.map((color) => ({
      id: `${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      size,
      color,
      quantity: baseQuantity,
    })),
  );
}

function syncInventory(
  sizes: string[],
  colors: string[],
  baseQuantity: number,
  existingInventory: BrandInventoryVariant[] = [],
) {
  const existingById = new Map(existingInventory.map((variant) => [variant.id, variant]));

  return sizes.flatMap((size) =>
    colors.map((color) => {
      const id = `${size}-${color}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existingVariant = existingById.get(id);

      return existingVariant ?? { id, size, color, quantity: baseQuantity };
    }),
  );
}

function toPortalProduct(product: (typeof demoProducts)[number], index: number): BrandPortalProduct {
  const colors = index % 2 === 0 ? ["Black", "Green"] : ["White", "Gray"];
  const baseQuantity = index === 1 ? 2 : 12;

  return {
    ...product,
    colors,
    imagePlaceholder: product.imageTone ?? "graphite",
    inventory: createInventory(product.sizes ?? ["OS"], colors, baseQuantity),
    soldOut: false,
  };
}

const defaultProducts = demoProducts.map(toPortalProduct);
const defaultCoupons: BrandCoupon[] = [
  {
    id: "coupon-local10",
    code: "LOCAL10",
    description: "Launch discount for local shoppers",
    discountType: "percent",
    amount: 10,
    startsAt: "2026-07-01",
    endsAt: "2026-08-01",
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "coupon-pickup",
    code: "PICKUP",
    description: "Free local pickup promotion",
    discountType: "free_pickup",
    amount: 0,
    startsAt: "2026-07-01",
    endsAt: "2026-09-01",
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

function readStorage<T>(key: string, fallback: T[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(BRAND_PORTAL_UPDATED_EVENT));
}

export type BrandProductInput = {
  id?: string;
  name: string;
  description: string;
  price: string;
  salePrice: string;
  category: ProductCategory;
  tags: string[];
  sizes: string[];
  colors: string[];
  sku: string;
  inventoryQuantity: string;
  imageUrls: string[];
  releaseDate: string;
  status: "draft" | "published";
};

export type BrandProfileInput = {
  name: string;
  username: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  websiteUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  city: string;
  state: string;
  zipCode: string;
};

export type BrandCouponInput = {
  id?: string;
  code: string;
  description: string;
  discountType: BrandCoupon["discountType"];
  amount: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductInventoryRow = Database["public"]["Tables"]["product_inventory"]["Row"];
type DashboardMode = "supabase" | "demo";

export type BrandDashboardProductsResult = {
  mode: DashboardMode;
  products: BrandPortalProduct[];
  brand?: BrandRow;
  error?: string;
};

export type BrandDashboardProfileResult = {
  mode: DashboardMode;
  brand?: BrandRow;
  error?: string;
};

export type BrandDashboardProductSaveResult = {
  mode: DashboardMode;
  product: BrandPortalProduct;
  products: BrandPortalProduct[];
  error?: string;
};

export function getBrandProducts() {
  return readStorage<BrandPortalProduct>(BRAND_PRODUCTS_STORAGE_KEY, defaultProducts);
}

export function saveBrandProduct(input: BrandProductInput) {
  const now = new Date().toISOString();
  const products = getBrandProducts();
  const sizes = input.sizes.filter((size) => STANDARD_SIZE_OPTIONS.includes(size));
  const colors = input.colors.filter((color) => STANDARD_COLOR_OPTIONS.includes(color));
  const priceCents = Math.max(1, Math.round(Number(input.price || 1)));
  const inventoryQuantity = Math.max(0, Number(input.inventoryQuantity || 0));
  const existingProduct = input.id ? products.find((product) => product.id === input.id) : null;
  const id = input.id ?? `brand-prod-${Date.now()}`;
  const product: BrandPortalProduct = {
    id,
    brandId: "brand-district-stitch",
    brandName: "District Stitch Co.",
    name: input.name.trim(),
    slug: existingProduct?.slug ?? slugify(input.name || id),
    description: input.description.trim(),
    category: input.category,
    imageTone: input.imageUrls[0] || "graphite",
    imagePlaceholder: input.imageUrls[0] || "graphite",
    imageUrls: input.imageUrls.filter(Boolean),
    sizes,
    colors,
    tags: input.tags,
    releaseDate: input.releaseDate || null,
    inventory: syncInventory(sizes, colors, inventoryQuantity, existingProduct?.inventory),
    pickupAvailable: true,
    priceCents,
    salePriceCents: input.salePrice ? Math.max(0, Math.round(Number(input.salePrice))) : undefined,
    status: input.status === "draft" ? "draft" : "active",
    soldOut: input.status === "draft",
    createdAt: existingProduct?.createdAt ?? now,
    updatedAt: now,
  };
  const nextProducts = existingProduct
    ? products.map((currentProduct) => (currentProduct.id === product.id ? product : currentProduct))
    : [product, ...products];

  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return product;
}

export function deleteBrandProduct(productId: string) {
  const nextProducts = getBrandProducts().filter((product) => product.id !== productId);
  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return nextProducts;
}

export function getBrandProductBySlug(slug: string) {
  return getBrandProducts().find((product) => product.slug === slug) ?? null;
}

export function updateInventoryQuantity(productId: string, variantId: string, quantity: number) {
  const nextProducts = getBrandProducts().map((product) => {
    if (product.id !== productId) {
      return product;
    }

    const inventory = product.inventory.map((variant) =>
      variant.id === variantId ? { ...variant, quantity: Math.max(0, quantity) } : variant,
    );
    const soldOut = inventory.every((variant) => variant.quantity === 0);

    return {
      ...product,
      inventory,
      soldOut,
      status: soldOut ? "archived" as const : "active" as const,
      updatedAt: new Date().toISOString(),
    };
  });

  writeStorage(BRAND_PRODUCTS_STORAGE_KEY, nextProducts);
  return nextProducts;
}

function getDemoDashboardProductsResult(error?: string): BrandDashboardProductsResult {
  return {
    mode: "demo",
    products: getBrandProducts(),
    error,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Supabase brand dashboard data is unavailable.";
}

function toNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function createBrandSlug(name: string, ownerId: string) {
  const baseSlug = slugify(name) || "threadocal-brand";
  return `${baseSlug}-${ownerId.slice(0, 8)}`;
}

async function getDashboardProfile() {
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "brand_owner" && profile.role !== "admin")) {
    return null;
  }

  return profile;
}

async function ensureOwnerBrand(): Promise<BrandRow | null> {
  const profile = await getDashboardProfile();

  if (!profile) {
    return null;
  }

  const supabase = createBrowserSupabaseClient();
  const { data: existingBrand, error: existingError } = await supabase
    .from("brands")
    .select("*")
    .eq("owner_profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingBrand) {
    return existingBrand;
  }

  const brandName = `${profile.full_name}'s Brand`;
  const { data: createdBrand, error: createError } = await supabase
    .from("brands")
    .insert({
      owner_profile_id: profile.id,
      name: brandName,
      slug: createBrandSlug(brandName, profile.id),
      description: "",
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
      approval_status: "pending_review",
      pickup_available: true,
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdBrand;
}

export async function getBrandDashboardProfile(): Promise<BrandDashboardProfileResult> {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      return { mode: "demo" };
    }

    return { mode: "supabase", brand };
  } catch (error) {
    return { mode: "demo", error: getErrorMessage(error) };
  }
}

export async function saveBrandDashboardProfile(input: BrandProfileInput): Promise<BrandDashboardProfileResult> {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      return { mode: "demo" };
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .update({
        name: input.name.trim(),
        slug: slugify(input.username || input.name),
        description: toNullable(input.bio),
        logo_url: toNullable(input.logoUrl),
        banner_url: toNullable(input.bannerUrl),
        website_url: toNullable(input.websiteUrl),
        instagram_url: toNullable(input.instagramUrl),
        tiktok_url: toNullable(input.tiktokUrl),
        youtube_url: toNullable(input.youtubeUrl),
        city: toNullable(input.city),
        state: toNullable(input.state),
        zip_code: toNullable(input.zipCode),
        updated_at: new Date().toISOString(),
      })
      .eq("id", brand.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { mode: "supabase", brand: data };
  } catch (error) {
    return { mode: "demo", error: getErrorMessage(error) };
  }
}

export async function uploadBrandDashboardAsset(kind: "logo" | "banner", file: File): Promise<BrandDashboardProfileResult> {
  try {
    const bucket = kind === "logo" ? BRAND_LOGO_BUCKET : BRAND_BANNER_BUCKET;
    const maxBytes = kind === "logo" ? LOGO_MAX_BYTES : MARKETPLACE_IMAGE_MAX_BYTES;
    const { brand, url } = await uploadMarketplaceImage(bucket, file, maxBytes);
    const supabase = createBrowserSupabaseClient();
    const update =
      kind === "logo"
        ? {
            logo_url: url,
            logo_moderation_status: "pending" as const,
            logo_reviewed_at: null,
            logo_reviewed_by: null,
            updated_at: new Date().toISOString(),
          }
        : {
            banner_url: url,
            banner_moderation_status: "pending" as const,
            banner_reviewed_at: null,
            banner_reviewed_by: null,
            updated_at: new Date().toISOString(),
          };
    const { data, error } = await supabase
      .from("brands")
      .update(update)
      .eq("id", brand.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { mode: "supabase", brand: data };
  } catch (error) {
    return { mode: "demo", error: getErrorMessage(error) };
  }
}

export async function uploadBrandDashboardProductImages(files: File[]) {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const { url } = await uploadMarketplaceImage(PRODUCT_IMAGE_BUCKET, file, MARKETPLACE_IMAGE_MAX_BYTES);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}

function mapSupabaseProduct(
  product: ProductRow,
  brand: BrandRow,
  images: ProductImageRow[],
  variants: ProductVariantRow[],
  inventoryRows: ProductInventoryRow[],
): BrandPortalProduct {
  const inventoryByVariantId = new Map(inventoryRows.map((inventory) => [inventory.product_variant_id, inventory]));
  const inventory = variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    quantity: inventoryByVariantId.get(variant.id)?.stock_quantity ?? 0,
  }));
  const sizes = Array.from(new Set(variants.map((variant) => variant.size)));
  const colors = Array.from(new Set(variants.map((variant) => variant.color)));
  const soldOut = inventory.length > 0 && inventory.every((variant) => variant.quantity === 0);
  const imageUrl = images[0]?.image_url ?? "";
  const productStatus = product.status === "draft" ? "draft" : product.status === "hidden" || product.status === "archived" ? "archived" : "active";

  return {
    id: product.id,
    brandId: brand.id,
    brandName: brand.name,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category: product.category as ProductCategory | undefined,
    imageTone: imageUrl || "graphite",
    imagePlaceholder: imageUrl || "graphite",
    imageUrls: images.map((image) => image.image_url),
    sizes,
    colors,
    tags: product.tags,
    releaseDate: product.release_date,
    inventory,
    pickupAvailable: product.pickup_available,
    priceCents: product.price_cents,
    salePriceCents: product.sale_price_cents ?? undefined,
    status: productStatus,
    soldOut: soldOut || product.status === "hidden" || product.status === "archived",
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

async function getSupabaseBrandProducts(brand: BrandRow): Promise<BrandPortalProduct[]> {
  const supabase = createBrowserSupabaseClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .order("updated_at", { ascending: false });

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const [{ data: images, error: imagesError }, { data: variants, error: variantsError }] = await Promise.all([
    supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order", { ascending: true }),
    supabase.from("product_variants").select("*").in("product_id", productIds),
  ]);

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  if (variantsError) {
    throw new Error(variantsError.message);
  }

  const variantIds = (variants ?? []).map((variant) => variant.id);
  const { data: inventoryRows, error: inventoryError } =
    variantIds.length > 0
      ? await supabase.from("product_inventory").select("*").in("product_variant_id", variantIds)
      : { data: [] as ProductInventoryRow[], error: null };

  if (inventoryError) {
    throw new Error(inventoryError.message);
  }

  return products.map((product) =>
    mapSupabaseProduct(
      product,
      brand,
      (images ?? []).filter((image) => image.product_id === product.id),
      (variants ?? []).filter((variant) => variant.product_id === product.id),
      (inventoryRows ?? []).filter((inventory) => variantIds.includes(inventory.product_variant_id)),
    ),
  );
}

export async function getBrandDashboardProducts(): Promise<BrandDashboardProductsResult> {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      return getDemoDashboardProductsResult();
    }

    return {
      mode: "supabase",
      brand,
      products: await getSupabaseBrandProducts(brand),
    };
  } catch (error) {
    return getDemoDashboardProductsResult(getErrorMessage(error));
  }
}

async function replaceSupabaseProductDetails(productId: string, input: BrandProductInput) {
  const supabase = createBrowserSupabaseClient();
  const imageUrls = input.imageUrls.map(toNullable).filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const sizes = input.sizes.filter((size) => STANDARD_SIZE_OPTIONS.includes(size));
  const colors = input.colors.filter((color) => STANDARD_COLOR_OPTIONS.includes(color));
  const inventoryQuantity = Math.max(0, Number(input.inventoryQuantity || 0));

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);

  if (imageUrls.length > 0) {
    const { error: imageError } = await supabase.from("product_images").insert(imageUrls.map((imageUrl, index) => ({
      product_id: productId,
      image_url: imageUrl,
      alt_text: input.name.trim(),
      sort_order: index,
      moderation_status: "pending" as const,
    })));

    if (imageError) {
      throw new Error(imageError.message);
    }
  }

  const variantInserts = sizes.flatMap((size) => colors.map((color) => ({ product_id: productId, size, color, sku: toNullable(input.sku) })));

  if (variantInserts.length === 0) {
    return;
  }

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .insert(variantInserts)
    .select("*");

  if (variantError) {
    throw new Error(variantError.message);
  }

  const inventoryInserts = (variants ?? []).map((variant) => ({
    product_variant_id: variant.id,
    stock_quantity: inventoryQuantity,
  }));

  if (inventoryInserts.length > 0) {
    const { error: inventoryError } = await supabase.from("product_inventory").insert(inventoryInserts);

    if (inventoryError) {
      throw new Error(inventoryError.message);
    }
  }
}

export async function saveBrandDashboardProduct(input: BrandProductInput): Promise<BrandDashboardProductSaveResult> {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      const product = saveBrandProduct(input);
      return { mode: "demo", product, products: getBrandProducts() };
    }

    const supabase = createBrowserSupabaseClient();
    const now = new Date().toISOString();
    const productPayload = {
      brand_id: brand.id,
      name: input.name.trim(),
      slug: input.id ? undefined : slugify(input.name || `product-${Date.now()}`),
      description: toNullable(input.description),
      category: input.category,
      price_cents: Math.max(1, Math.round(Number(input.price || 1))),
      sale_price_cents: input.salePrice ? Math.max(0, Math.round(Number(input.salePrice))) : null,
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
      release_date: toNullable(input.releaseDate),
      status: input.status,
      pickup_available: true,
      updated_at: now,
    };

    const { data: product, error: productError } = input.id
      ? await supabase
          .from("products")
          .update({ ...productPayload, slug: undefined })
          .eq("id", input.id)
          .select("*")
          .single()
      : await supabase
          .from("products")
          .insert({ ...productPayload, slug: productPayload.slug ?? `product-${Date.now()}` })
          .select("*")
          .single();

    if (productError) {
      throw new Error(productError.message);
    }

    await replaceSupabaseProductDetails(product.id, input);

    const products = await getSupabaseBrandProducts(brand);
    const savedProduct = products.find((currentProduct) => currentProduct.id === product.id) ?? products[0];

    return {
      mode: "supabase",
      product: savedProduct,
      products,
    };
  } catch (error) {
    const product = saveBrandProduct(input);
    return {
      mode: "demo",
      product,
      products: getBrandProducts(),
      error: getErrorMessage(error),
    };
  }
}

export async function duplicateBrandDashboardProduct(productId: string) {
  const current = await getBrandDashboardProducts();
  const product = current.products.find((currentProduct) => currentProduct.id === productId);

  if (!product) {
    return current;
  }

  const result = await saveBrandDashboardProduct({
    name: `${product.name} Copy`,
    description: product.description ?? "",
    price: String(product.priceCents),
    salePrice: product.salePriceCents ? String(product.salePriceCents) : "",
    category: product.category ?? "menswear",
    tags: product.tags ?? [],
    sizes: product.sizes ?? [],
    colors: product.colors ?? [],
    sku: product.inventory[0]?.sku ?? "",
    inventoryQuantity: String(product.inventory[0]?.quantity ?? 0),
    imageUrls: product.imageUrls ?? [],
    releaseDate: product.releaseDate ?? "",
    status: product.status === "draft" ? "draft" : "published",
  });

  return {
    mode: result.mode,
    products: result.products,
    brand: current.brand,
    error: result.error,
  };
}

export async function deleteBrandDashboardProduct(productId: string) {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      return getDemoDashboardProductsResult();
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("products").delete().eq("id", productId).eq("brand_id", brand.id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      mode: "supabase" as const,
      brand,
      products: await getSupabaseBrandProducts(brand),
    };
  } catch (error) {
    return {
      mode: "demo" as const,
      products: deleteBrandProduct(productId),
      error: getErrorMessage(error),
    };
  }
}

export async function updateBrandDashboardInventoryQuantity(productId: string, variantId: string, quantity: number) {
  try {
    const brand = await ensureOwnerBrand();

    if (!brand) {
      return getDemoDashboardProductsResult();
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("product_inventory")
      .update({ stock_quantity: Math.max(0, quantity), updated_at: new Date().toISOString() })
      .eq("product_variant_id", variantId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      mode: "supabase" as const,
      brand,
      products: await getSupabaseBrandProducts(brand),
    };
  } catch (error) {
    return {
      mode: "demo" as const,
      products: updateInventoryQuantity(productId, variantId, quantity),
      error: getErrorMessage(error),
    };
  }
}

export function getBrandCoupons() {
  return readStorage<BrandCoupon>(BRAND_COUPONS_STORAGE_KEY, defaultCoupons);
}

export function saveBrandCoupon(input: BrandCouponInput) {
  const now = new Date().toISOString();
  const coupons = getBrandCoupons();
  const existingCoupon = input.id ? coupons.find((coupon) => coupon.id === input.id) : null;
  const coupon: BrandCoupon = {
    id: input.id ?? `coupon-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    discountType: input.discountType,
    amount: input.discountType === "free_pickup" ? 0 : Math.max(0, Number(input.amount || 0)),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    active: input.active,
    createdAt: existingCoupon?.createdAt ?? now,
    updatedAt: now,
  };
  const nextCoupons = existingCoupon
    ? coupons.map((currentCoupon) => (currentCoupon.id === coupon.id ? coupon : currentCoupon))
    : [coupon, ...coupons];

  writeStorage(BRAND_COUPONS_STORAGE_KEY, nextCoupons);
  return coupon;
}

export function deleteBrandCoupon(couponId: string) {
  const nextCoupons = getBrandCoupons().filter((coupon) => coupon.id !== couponId);
  writeStorage(BRAND_COUPONS_STORAGE_KEY, nextCoupons);
  return nextCoupons;
}
