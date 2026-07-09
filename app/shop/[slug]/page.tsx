import { notFound } from "next/navigation";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";
import { demoProducts, getProductBySlug } from "@/lib/demo/marketplace";
import { routes } from "@/utils/routes";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ThreadocalPage
      eyebrow={product.brandName ?? "Threadocal brand"}
      title={product.name}
      intro={product.description ?? "Demo product listing for the local marketplace flow."}
      breadcrumbs={[{ label: "Shop", href: routes.shop }, { label: product.name }]}
    >
      <ProductDetailClient fallbackProduct={product} />
    </ThreadocalPage>
  );
}
