export type BrandPreview = {
  name: string;
  slug?: string;
  city: string;
  category: string;
  rating: string;
  code: string;
  miles: number;
  partnered: boolean;
};

export type BrandStatus = "draft" | "pending_review" | "active" | "suspended";

export type BrandProfile = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  category?: string;
  city: string;
  state: string;
  pickupAvailable?: boolean;
  rating?: string;
  productCount?: number;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
};

export type DemoBrandSubmission = {
  brandName: string;
  ownerName: string;
  email: string;
  city: string;
  state: string;
  category: string;
  description: string;
  pickupAvailable: boolean;
};
