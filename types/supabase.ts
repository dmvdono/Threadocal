import type { Profile, UserRole } from "@/types/auth";

export type BrandApprovalStatus = "pending_review" | "approved" | "rejected" | "suspended";
export type MarketplaceProductStatus = "draft" | "published" | "hidden" | "archived";
export type ImageModerationStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: UserRole;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          owner_profile_id: string;
          name: string;
          slug: string;
          tagline: string | null;
          description: string | null;
          category: string | null;
          logo_url: string | null;
          logo_moderation_status: ImageModerationStatus;
          logo_reviewed_at: string | null;
          logo_reviewed_by: string | null;
          banner_url: string | null;
          banner_moderation_status: ImageModerationStatus;
          banner_reviewed_at: string | null;
          banner_reviewed_by: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          website_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          verified: boolean;
          approval_status: BrandApprovalStatus;
          pickup_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_profile_id: string;
          name: string;
          slug: string;
          tagline?: string | null;
          description?: string | null;
          category?: string | null;
          logo_url?: string | null;
          logo_moderation_status?: ImageModerationStatus;
          logo_reviewed_at?: string | null;
          logo_reviewed_by?: string | null;
          banner_url?: string | null;
          banner_moderation_status?: ImageModerationStatus;
          banner_reviewed_at?: string | null;
          banner_reviewed_by?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          verified?: boolean;
          approval_status?: BrandApprovalStatus;
          pickup_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_profile_id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          description?: string | null;
          category?: string | null;
          logo_url?: string | null;
          logo_moderation_status?: ImageModerationStatus;
          logo_reviewed_at?: string | null;
          logo_reviewed_by?: string | null;
          banner_url?: string | null;
          banner_moderation_status?: ImageModerationStatus;
          banner_reviewed_at?: string | null;
          banner_reviewed_by?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          verified?: boolean;
          approval_status?: BrandApprovalStatus;
          pickup_available?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string | null;
          price_cents: number;
          sale_price_cents: number | null;
          tags: string[];
          release_date: string | null;
          status: MarketplaceProductStatus;
          pickup_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          slug: string;
          description?: string | null;
          category?: string | null;
          price_cents: number;
          sale_price_cents?: number | null;
          tags?: string[];
          release_date?: string | null;
          status?: MarketplaceProductStatus;
          pickup_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category?: string | null;
          price_cents?: number;
          sale_price_cents?: number | null;
          tags?: string[];
          release_date?: string | null;
          status?: MarketplaceProductStatus;
          pickup_available?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          moderation_status: ImageModerationStatus;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          moderation_status?: ImageModerationStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          moderation_status?: ImageModerationStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color: string;
          sku: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          color: string;
          sku?: string | null;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          size?: string;
          color?: string;
          sku?: string | null;
        };
        Relationships: [];
      };
      product_inventory: {
        Row: {
          product_variant_id: string;
          stock_quantity: number;
          updated_at: string;
        };
        Insert: {
          product_variant_id: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
