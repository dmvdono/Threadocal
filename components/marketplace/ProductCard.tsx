import Link from "next/link";
import { FavoriteProductButton } from "@/components/customer/FavoriteProductButton";
import type { Product } from "@/types/product";
import { formatCents } from "@/utils/money";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const productHref = `/product/${product.slug}`;

  return (
    <article className="product-card">
      <FavoriteProductButton className="heart" label={`Favorite ${product.name}`} productId={product.id} />
      <Link className={`product-art tone-${product.imageUrls?.[0] ? "graphite" : product.imageTone ?? "graphite"}`} href={productHref}>
        {product.imageUrls?.[0] ? <img src={product.imageUrls[0]} alt={product.name} /> : <span>{product.brandName}</span>}
      </Link>
      <div className="product-info">
        <p>{product.brandName}</p>
        <h2>
          <Link href={productHref}>{product.name}</Link>
        </h2>
        <div className="product-meta">
          <span>{product.category}</span>
          {product.pickupAvailable && <span>Pickup available</span>}
        </div>
        <div className="price-row">
          {product.salePriceCents ? (
            <>
              <strong>{formatCents(product.salePriceCents)}</strong>
              <s>{formatCents(product.priceCents)}</s>
            </>
          ) : (
            <strong>{formatCents(product.priceCents)}</strong>
          )}
        </div>
        <Link className="primary-link" href={productHref}>
          Select Options
        </Link>
      </div>
    </article>
  );
}
