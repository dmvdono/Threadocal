export type ProductStatus = "draft" | "active" | "archived";
export type FulfillmentMethod = "shipping" | "local_pickup";

export type Product = {
  id: string;
  brandId: string;
  brandName?: string;
  name: string;
  slug: string;
  description?: string;
  category?: ProductCategory;
  imageTone?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  releaseDate?: string | null;
  pickupAvailable?: boolean;
  salePriceCents?: number;
  priceCents: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type BrandPortalProduct = Product & {
  colors: string[];
  inventory: BrandInventoryVariant[];
  imagePlaceholder: string;
  soldOut: boolean;
};

export type BrandInventoryVariant = {
  id: string;
  size: string;
  color: string;
  quantity: number;
  sku?: string | null;
};

export type BrandCoupon = {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed" | "free_pickup";
  amount: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategory =
  | "menswear"
  | "womenswear"
  | "kidswear"
  | "seasonal"
  | "sportswear"
  | "sale";

export type CartItem = {
  id: string;
  productId: string;
  selectedSize: string | null;
  fulfillmentMethod: FulfillmentMethod;
  pickupSlot: string | null;
  quantity: number;
};
