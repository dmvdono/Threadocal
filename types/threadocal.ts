import type { BrandPreview } from "@/types/brand";
import type { AppRoute } from "@/utils/routes";

export type NavItem = {
  label: string;
  href: AppRoute;
};

export type StarterCard = {
  title: string;
  body: string;
};

export type { BrandPreview };
