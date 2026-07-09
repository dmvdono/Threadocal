import Link from "next/link";
import { FavoriteProductButton } from "@/components/customer/FavoriteProductButton";
import type { Product } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <FavoriteProductButton className="heart" label={`Favorite ${product.name}`} productId={product.id} />
      <Link className={`product-art tone-${product.imageTone ?? "graphite"}`} href={`${routes.shop}/${product.slug}`}>
        <span>{product.brandName}</span>
      </Link>
      <div className="product-info">
        <p>{product.brandName}</p>
        <h2>
          <Link href={`${routes.shop}/${product.slug}`}>{product.name}</Link>
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
        <Link className="primary-link" href={`${routes.shop}/${product.slug}`}>
          Select Options
        </Link>
      </div>
    </article>
  );
}
