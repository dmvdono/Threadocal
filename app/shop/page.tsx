import Link from "next/link";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { ShopProductGridClient } from "@/components/marketplace/ShopProductGridClient";
import { getPublicProducts } from "@/services/marketplace";
import { routes } from "@/utils/routes";

const productCategories = [
  { label: "All", value: "all" },
  { label: "Menswear", value: "menswear" },
  { label: "Womenswear", value: "womenswear" },
  { label: "Kidswear", value: "kidswear" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Sportswear", value: "sportswear" },
  { label: "Sale", value: "sale" },
];

const categoryLabels: Record<string, string> = {
  menswear: "Menswear",
  womenswear: "Womenswear",
  kidswear: "Kidswear",
  seasonal: "Seasonal",
  sportswear: "Sportswear",
  sale: "Sale",
};

type ShopPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const category = (await searchParams)?.category;
  const categoryLabel = category ? categoryLabels[category] : null;
  const products = await getPublicProducts(category);

  return (
    <ThreadocalPage
      eyebrow="Shop local clothing"
      title={categoryLabel ? `${categoryLabel} Shop` : "Shop"}
      intro={
        categoryLabel
          ? `Browse ${categoryLabel.toLowerCase()} from independent clothing brands. Product listings will appear here as inventory is connected.`
          : "Discover clothing from independent brands by category, city, promotion, and pickup availability."
      }
      breadcrumbs={categoryLabel ? [{ label: "Shop", href: routes.shop }, { label: categoryLabel }] : [{ label: "Shop" }]}
    >
      <section className="shop-filters" aria-label="Shop categories">
        {productCategories.map((item) => (
          <Link
            className={`filter-chip ${(!category && item.value === "all") || category === item.value ? "active" : ""}`}
            href={item.value === "all" ? routes.shop : `${routes.shop}?category=${item.value}`}
            key={item.value}
          >
            {item.label}
          </Link>
        ))}
      </section>

      <ShopProductGridClient category={category} fallbackProducts={products} />
    </ThreadocalPage>
  );
}
