"use client";

import { createBrowserSupabaseClient } from "@/supabase/client";
import type { BrandPortalProduct, Product, ProductCategory } from "@/types/product";
import type { Database } from "@/types/supabase";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductInventoryRow = Database["public"]["Tables"]["product_inventory"]["Row"];

type ProductQueryOptions = {
  ids?: string[];
  slugs?: string[];
  includeOwnerPendingImages?: boolean;
};

function toProductStatus(status: ProductRow["status"]): Product["status"] {
  if (status === "draft") {
    return "draft";
  }

  if (status === "hidden" || status === "archived") {
    return "archived";
  }

  return "active";
}

export function mapMarketplaceProduct(
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
  const visibleImages = images.sort((left, right) => left.sort_order - right.sort_order);
  const firstImageUrl = visibleImages[0]?.image_url ?? "";
  const soldOut = inventory.length > 0 && inventory.every((variant) => variant.quantity === 0);

  return {
    id: product.id,
    brandId: brand.id,
    brandName: brand.name,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category: product.category as ProductCategory | undefined,
    imageTone: firstImageUrl || "graphite",
    imagePlaceholder: firstImageUrl || "graphite",
    imageUrls: visibleImages.map((image) => image.image_url),
    sizes,
    colors,
    tags: product.tags,
    releaseDate: product.release_date,
    inventory,
    pickupAvailable: product.pickup_available,
    priceCents: product.price_cents,
    salePriceCents: product.sale_price_cents ?? undefined,
    status: toProductStatus(product.status),
    soldOut: soldOut || product.status === "hidden" || product.status === "archived",
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

async function loadProductDetails(products: ProductRow[], includeOwnerPendingImages = false) {
  if (products.length === 0) {
    return [];
  }

  const supabase = createBrowserSupabaseClient();
  const brandIds = Array.from(new Set(products.map((product) => product.brand_id)));
  const productIds = products.map((product) => product.id);
  const [{ data: brands, error: brandsError }, { data: images, error: imagesError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase.from("brands").select("*").in("id", brandIds),
      supabase
        .from("product_images")
        .select("*")
        .in("product_id", productIds)
        .in("moderation_status", includeOwnerPendingImages ? ["pending", "approved"] : ["approved"])
        .order("sort_order", { ascending: true }),
      supabase.from("product_variants").select("*").in("product_id", productIds),
    ]);

  if (brandsError) {
    throw new Error(brandsError.message);
  }

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

  const brandById = new Map((brands ?? []).map((brand) => [brand.id, brand]));

  return products.flatMap((product) => {
    const brand = brandById.get(product.brand_id);

    if (!brand) {
      return [];
    }

    return [
      mapMarketplaceProduct(
        product,
        brand,
        (images ?? []).filter((image) => image.product_id === product.id),
        (variants ?? []).filter((variant) => variant.product_id === product.id),
        (inventoryRows ?? []).filter((inventory) => variantIds.includes(inventory.product_variant_id)),
      ),
    ];
  });
}

export async function getMarketplaceProducts(options: ProductQueryOptions = {}) {
  const supabase = createBrowserSupabaseClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (options.ids?.length) {
    query = query.in("id", options.ids);
  }

  if (options.slugs?.length) {
    query = query.in("slug", options.slugs);
  }

  const { data: products, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return loadProductDetails(products ?? [], options.includeOwnerPendingImages);
}

export async function getMarketplaceProductBySlug(slug: string) {
  const products = await getMarketplaceProducts({ slugs: [slug] });
  return products[0] ?? null;
}

export async function getMarketplaceProductsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return getMarketplaceProducts({ ids: Array.from(new Set(ids)) });
}
