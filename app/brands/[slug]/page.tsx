import { notFound } from "next/navigation";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { BrandStorefrontClient } from "@/components/marketplace/BrandStorefrontClient";
import { demoBrands, demoProducts, getBrandBySlug } from "@/lib/demo/marketplace";
import { routes } from "@/utils/routes";

type BrandStorefrontPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return demoBrands.map((brand) => ({ slug: brand.slug }));
}

export default async function BrandStorefrontPage({ params }: BrandStorefrontPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const products = demoProducts.filter((product) => product.brandId === brand.id);

  return (
    <ThreadocalPage
      eyebrow="Brand storefront"
      title={brand.name}
      intro={brand.tagline ?? "Independent clothing brand storefront in Threadocal demo mode."}
      breadcrumbs={[{ label: "Brands", href: routes.brands }, { label: brand.name }]}
    >
      <BrandStorefrontClient brand={brand} fallbackProducts={products} />
    </ThreadocalPage>
  );
}
