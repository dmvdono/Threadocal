import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteBrandButton } from "@/components/customer/FavoriteBrandButton";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { getPublicBrandByUsername } from "@/services/marketplace";

type PublicBrandPageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicBrandPage({ params }: PublicBrandPageProps) {
  const { username } = await params;
  const storefront = await getPublicBrandByUsername(username);

  if (!storefront) {
    notFound();
  }

  const { brand, products } = storefront;

  return (
    <main className="public-brand-page">
      <section className="brand-storefront">
        <div className="brand-storefront-hero">
          <div className="brand-banner public-media">
            {brand.bannerUrl ? <img src={brand.bannerUrl} alt={`${brand.name} banner`} /> : <span>{brand.name.slice(0, 2)}</span>}
          </div>
          <article className="brand-storefront-info">
            <div className="brand-logo public-logo">
              {brand.logoUrl ? <img src={brand.logoUrl} alt={`${brand.name} logo`} /> : brand.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">{brand.verified ? "Verified brand" : "Independent brand"}</p>
              <h2>{brand.name}</h2>
              <p>{brand.description}</p>
              <div className="product-meta">
                <span>@{brand.slug}</span>
                <span>{[brand.city, brand.state].filter(Boolean).join(", ")}</span>
                <span>{products.length} products</span>
              </div>
              <div className="social-row">
                {brand.websiteUrl && <Link href={brand.websiteUrl}>Website</Link>}
                {brand.instagramUrl && <Link href={brand.instagramUrl}>Instagram</Link>}
                {brand.tiktokUrl && <Link href={brand.tiktokUrl}>TikTok</Link>}
                {brand.youtubeUrl && <Link href={brand.youtubeUrl}>YouTube</Link>}
              </div>
            </div>
            <FavoriteBrandButton brandName={brand.name} brandSlug={brand.slug} className="secondary-action" showText />
          </article>
        </div>
        <div className="product-grid storefront-products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
