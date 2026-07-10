import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteProductButton } from "@/components/customer/FavoriteProductButton";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductPurchaseForm } from "@/components/marketplace/ProductPurchaseForm";
import { getPublicProductBySlug } from "@/services/marketplace";
import { formatCents } from "@/utils/money";

type PublicProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicProductPage({ params }: PublicProductPageProps) {
  const { slug } = await params;
  const productPage = await getPublicProductBySlug(slug);

  if (!productPage) {
    notFound();
  }

  const { brand, product, relatedProducts } = productPage;

  return (
    <main className="public-product-page">
      <section className="product-detail">
        <div className="product-gallery">
          {(product.imageUrls?.length ? product.imageUrls : [""]).map((imageUrl, index) => (
            <div className={`product-detail-art tone-${imageUrl ? "graphite" : product.imageTone ?? "graphite"}`} key={`${product.id}-${index}`}>
              {imageUrl ? <img src={imageUrl} alt={`${product.name} ${index + 1}`} /> : <span>{product.brandName}</span>}
            </div>
          ))}
        </div>
        <article className="product-detail-panel">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <Link className="secondary-link" href={`/brand/${brand.slug}`}>
            {brand.name}
          </Link>
          <FavoriteProductButton
            className="secondary-action compact-action"
            label={`Favorite ${product.name}`}
            productId={product.id}
          />
          <h2>{product.salePriceCents ? formatCents(product.salePriceCents) : formatCents(product.priceCents)}</h2>
          {product.salePriceCents && <s>{formatCents(product.priceCents)}</s>}
          <p>{product.description}</p>
          {product.tags && product.tags.length > 0 && (
            <div className="product-meta">
              {product.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
          <ProductPurchaseForm product={product} />
        </article>
      </section>
      {relatedProducts.length > 0 && (
        <section className="brands-section">
          <div className="section-head">
            <h2>Related products</h2>
          </div>
          <div className="product-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
