import type { BrandPreview, NavItem } from "@/types/threadocal";
import { routes } from "@/utils/routes";

export const mainNavItems: NavItem[] = [
  { label: "Home", href: routes.home },
  { label: "Shop", href: routes.shop },
  { label: "Brands", href: routes.brands },
  { label: "Promotions", href: routes.promotions },
  { label: "How It Works", href: routes.howItWorks },
];

export const accountNavItems: NavItem[] = [
  { label: "Dashboard", href: routes.dashboard },
  { label: "Brand Dashboard", href: routes.brandDashboard },
  { label: "Admin", href: routes.admin },
];

export const featuredBrands: BrandPreview[] = [
  {
    name: "District Stitch Co.",
    city: "Washington, DC",
    category: "Heavyweight Streetwear",
    rating: "4.8",
    code: "DS",
    miles: 2.4,
    partnered: true,
  },
  {
    name: "Southside Supply",
    city: "Atlanta, GA",
    category: "Urban Essentials",
    rating: "4.7",
    code: "SS",
    miles: 5.4,
    partnered: true,
  },
  {
    name: "Parallel Vintage",
    city: "Austin, TX",
    category: "Vintage Reimagined",
    rating: "4.9",
    code: "PV",
    miles: 9.3,
    partnered: false,
  },
  {
    name: "Nova Wave",
    city: "Los Angeles, CA",
    category: "Y2K & Contemporary",
    rating: "4.8",
    code: "NW",
    miles: 12.8,
    partnered: true,
  },
];
