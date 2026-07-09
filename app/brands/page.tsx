import Link from "next/link";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { demoBrands } from "@/lib/demo/marketplace";
import { routes } from "@/utils/routes";

type BrandsPageProps = {
  searchParams?: Promise<{
    city?: string;
  }>;
};

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const city = (await searchParams)?.city;
  const visibleBrands = city
    ? demoBrands.filter((brand) => `${brand.city}, ${brand.state}`.toLowerCase() === city.toLowerCase())
    : demoBrands;

  return (
    <ThreadocalPage
      eyebrow="Independent labels"
      title={city ? `${city} Brands` : "Brands"}
      intro={
        city
          ? `Browse independent clothing brands in ${city}.`
          : "Browse the independent clothing brands building community through Threadocal."
      }
      breadcrumbs={city ? [{ label: "Brands", href: routes.brands }, { label: city }] : [{ label: "Brands" }]}
    >
      <section className="quick-links" aria-label="Brand actions">
        <Link href={routes.brandSubmit}>Submit a Brand</Link>
        <Link href={routes.brandPreview}>Preview Demo Profile</Link>
      </section>
      <section className="brands-section">
        <div className="brand-profile-grid">
          {visibleBrands.map((brand) => (
            <article className="brand-profile-card" key={brand.id}>
              <div className="brand-preview-art">{brand.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <p className="eyebrow">{brand.category}</p>
                <h2>{brand.name}</h2>
                <p>{brand.description}</p>
                <div className="product-meta">
                  <span>
                    {brand.city}, {brand.state}
                  </span>
                  <span>{brand.pickupAvailable ? "Pickup available" : "Shipping only"}</span>
                  <span>{brand.productCount} demo products</span>
                </div>
                <Link className="primary-link inline-primary" href={`${routes.brands}/${brand.slug}`}>
                  View Storefront
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ThreadocalPage>
  );
}
