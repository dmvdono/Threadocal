import type { BrandProfile, DemoBrandSubmission } from "@/types/brand";
import type { Product, ProductCategory } from "@/types/product";

export const productCategories: { label: string; value: ProductCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Menswear", value: "menswear" },
  { label: "Womenswear", value: "womenswear" },
  { label: "Kidswear", value: "kidswear" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Sportswear", value: "sportswear" },
  { label: "Sale", value: "sale" },
];

export const demoPickupSlots = [
  "Today, 4:00 PM - 6:00 PM",
  "Tomorrow, 11:00 AM - 1:00 PM",
  "Tomorrow, 5:00 PM - 7:00 PM",
  "Saturday, 12:00 PM - 3:00 PM",
];

export const demoPickupLocation = "Threadocal demo pickup counter, brand location placeholder";

export const demoBrands: BrandProfile[] = [
  {
    id: "brand-district-stitch",
    ownerId: "demo-owner-1",
    name: "District Stitch Co.",
    slug: "district-stitch-co",
    tagline: "Heavyweight streetwear cut and sewn in DC.",
    description:
      "A local streetwear label focused on heavyweight fleece, oversized tees, and capsule drops inspired by Washington neighborhoods.",
    category: "Heavyweight Streetwear",
    city: "Washington",
    state: "DC",
    pickupAvailable: true,
    rating: "4.8",
    productCount: 3,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "brand-southside-supply",
    ownerId: "demo-owner-2",
    name: "Southside Supply",
    slug: "southside-supply",
    tagline: "Everyday essentials with Atlanta energy.",
    description:
      "Southside Supply makes easy layers, utility pants, and soft goods for people who dress for movement and community.",
    category: "Urban Essentials",
    city: "Atlanta",
    state: "GA",
    pickupAvailable: true,
    rating: "4.7",
    productCount: 2,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "brand-parallel-vintage",
    ownerId: "demo-owner-3",
    name: "Parallel Vintage",
    slug: "parallel-vintage",
    tagline: "Vintage blanks, reworked for today.",
    description:
      "Parallel Vintage sources quality secondhand pieces and reworks them into limited runs with fresh shapes and finishes.",
    category: "Vintage Reimagined",
    city: "Austin",
    state: "TX",
    pickupAvailable: false,
    rating: "4.9",
    productCount: 2,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const demoProducts: Product[] = [
  {
    id: "prod-capital-hoodie",
    brandId: "brand-district-stitch",
    brandName: "District Stitch Co.",
    name: "Capital Heavyweight Hoodie",
    slug: "capital-heavyweight-hoodie",
    description: "A 14 oz brushed fleece hoodie with a relaxed fit, ribbed side panels, and local pickup in DC.",
    category: "menswear",
    imageTone: "graphite",
    sizes: ["S", "M", "L", "XL"],
    pickupAvailable: true,
    priceCents: 7800,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-metro-crop",
    brandId: "brand-district-stitch",
    brandName: "District Stitch Co.",
    name: "Metro Rib Crop Tee",
    slug: "metro-rib-crop-tee",
    description: "Soft rib cotton crop tee with a structured neckline and limited local run.",
    category: "womenswear",
    imageTone: "lime",
    sizes: ["XS", "S", "M", "L"],
    pickupAvailable: true,
    priceCents: 3600,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-sideline-track",
    brandId: "brand-southside-supply",
    brandName: "Southside Supply",
    name: "Sideline Track Pant",
    slug: "sideline-track-pant",
    description: "Lightweight nylon track pants with snap hems, mesh lining, and an easy straight leg.",
    category: "sportswear",
    imageTone: "steel",
    sizes: ["S", "M", "L", "XL"],
    pickupAvailable: true,
    priceCents: 6400,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-kids-logo-set",
    brandId: "brand-southside-supply",
    brandName: "Southside Supply",
    name: "Mini Logo Set",
    slug: "mini-logo-set",
    description: "A soft tee and short set for kids, made for summer errands and weekend plans.",
    category: "kidswear",
    imageTone: "clay",
    sizes: ["2T", "4T", "6", "8"],
    pickupAvailable: true,
    priceCents: 4200,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-rework-bomber",
    brandId: "brand-parallel-vintage",
    brandName: "Parallel Vintage",
    name: "Rework Canvas Bomber",
    slug: "rework-canvas-bomber",
    description: "One-of-one canvas bomber rebuilt from vintage workwear panels.",
    category: "seasonal",
    imageTone: "olive",
    sizes: ["M"],
    pickupAvailable: false,
    priceCents: 14800,
    salePriceCents: 12600,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prod-archive-denim",
    brandId: "brand-parallel-vintage",
    brandName: "Parallel Vintage",
    name: "Archive Denim Shirt",
    slug: "archive-denim-shirt",
    description: "Washed denim overshirt with contrast repairs and vintage pearl snaps.",
    category: "sale",
    imageTone: "indigo",
    sizes: ["S", "M", "L"],
    pickupAvailable: false,
    priceCents: 7200,
    salePriceCents: 5400,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const defaultBrandSubmission: DemoBrandSubmission = {
  brandName: "",
  ownerName: "",
  email: "",
  city: "",
  state: "",
  category: "Streetwear",
  description: "",
  pickupAvailable: true,
};

export function getProductBySlug(slug: string) {
  return demoProducts.find((product) => product.slug === slug) ?? null;
}

export function getBrandBySlug(slug: string) {
  return demoBrands.find((brand) => brand.slug === slug) ?? null;
}

export function getProductsByCategory(category?: string) {
  if (!category || category === "all") {
    return demoProducts;
  }

  return demoProducts.filter((product) => product.category === category);
}
