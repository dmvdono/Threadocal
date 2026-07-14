import { createServerSupabaseClient } from "@/supabase/server";
import type { BrandProfile } from "@/types/brand";
import type { BrandPortalProduct, ProductCategory } from "@/types/product";
import type { Database } from "@/types/supabase";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductInventoryRow = Database["public"]["Tables"]["product_inventory"]["Row"];

function mapBrand(row: BrandRow, productCount = 0): BrandProfile {
  return {
    id: row.id,
    ownerId: row.owner_profile_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    category: row.category ?? "Independent clothing",
    logoUrl: row.logo_moderation_status === "approved" ? row.logo_url : null,
    bannerUrl: row.banner_moderation_status === "approved" ? row.banner_url : null,
    city: row.city ?? "",
    state: row.state ?? "",
    zipCode: row.zip_code,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    youtubeUrl: row.youtube_url,
    verified: row.verified,
    pickupAvailable: row.pickup_available,
    productCount,
    status: row.approval_status === "approved" ? "active" : "pending_review",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProduct(
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
  const imageUrls = images.map((image) => image.image_url);

  return {
    id: product.id,
    brandId: brand.id,
    brandName: brand.name,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category: product.category as ProductCategory | undefined,
    imageTone: imageUrls[0] || "graphite",
    imagePlaceholder: imageUrls[0] || "graphite",
    imageUrls,
    sizes: Array.from(new Set(variants.map((variant) => variant.size))),
    colors: Array.from(new Set(variants.map((variant) => variant.color))),
    tags: product.tags,
    releaseDate: product.release_date,
    inventory,
    pickupAvailable: product.pickup_available,
    salePriceCents: product.sale_price_cents ?? undefined,
    priceCents: product.price_cents,
    status: product.status === "draft" ? "draft" : "active",
    soldOut: inventory.length > 0 && inventory.every((variant) => variant.quantity === 0),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

async function getProductDetails(productIds: string[]) {
  const supabase = createServerSupabaseClient();

  if (productIds.length === 0) {
    return { images: [], variants: [], inventoryRows: [] };
  }

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from("product_images")
      .select("*")
      .in("product_id", productIds)
      .eq("moderation_status", "approved")
      .order("sort_order", { ascending: true }),
    supabase.from("product_variants").select("*").in("product_id", productIds),
  ]);
  const variantIds = (variants ?? []).map((variant) => variant.id);
  const { data: inventoryRows } =
    variantIds.length > 0
      ? await supabase.from("product_inventory").select("*").in("product_variant_id", variantIds)
      : { data: [] as ProductInventoryRow[] };

  return {
    images: images ?? [],
    variants: variants ?? [],
    inventoryRows: inventoryRows ?? [],
  };
}

export async function getPublicBrandByUsername(username: string) {
  const supabase = createServerSupabaseClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", username)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!brand) {
    return null;
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  const productRows = products ?? [];
  const details = await getProductDetails(productRows.map((product) => product.id));

  return {
    brand: mapBrand(brand, productRows.length),
    products: productRows.map((product) =>
      mapProduct(
        product,
        brand,
        details.images.filter((image) => image.product_id === product.id),
        details.variants.filter((variant) => variant.product_id === product.id),
        details.inventoryRows,
      ),
    ),
  };
}

export async function getPublicProductBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product) {
    return null;
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", product.brand_id)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!brand) {
    return null;
  }

  const details = await getProductDetails([product.id]);
  const { data: relatedRows } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("status", "published")
    .neq("id", product.id)
    .limit(4);
  const relatedDetails = await getProductDetails((relatedRows ?? []).map((relatedProduct) => relatedProduct.id));

  return {
    brand: mapBrand(brand),
    product: mapProduct(product, brand, details.images, details.variants, details.inventoryRows),
    relatedProducts: (relatedRows ?? []).map((relatedProduct) =>
      mapProduct(
        relatedProduct,
        brand,
        relatedDetails.images.filter((image) => image.product_id === relatedProduct.id),
        relatedDetails.variants.filter((variant) => variant.product_id === relatedProduct.id),
        relatedDetails.inventoryRows,
      ),
    ),
  };
}

export async function getPublicProducts(category?: string) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: products } = await query;
  const productRows = products ?? [];

  if (productRows.length === 0) {
    return [];
  }

  const brandIds = Array.from(new Set(productRows.map((product) => product.brand_id)));
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .in("id", brandIds)
    .eq("approval_status", "approved");
  const approvedBrands = new Map((brands ?? []).map((brand) => [brand.id, brand]));
  const visibleProducts = productRows.filter((product) => approvedBrands.has(product.brand_id));
  const details = await getProductDetails(visibleProducts.map((product) => product.id));

  return visibleProducts.map((product) =>
    mapProduct(
      product,
      approvedBrands.get(product.brand_id)!,
      details.images.filter((image) => image.product_id === product.id),
      details.variants.filter((variant) => variant.product_id === product.id),
      details.inventoryRows,
    ),
  );
}
