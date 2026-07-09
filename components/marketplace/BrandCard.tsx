import Link from "next/link";
import { FavoriteBrandButton } from "@/components/customer/FavoriteBrandButton";
import type { BrandPreview } from "@/types/brand";
import { formatDistance, formatRating } from "@/utils/format";
import { routes } from "@/utils/routes";

type BrandCardProps = {
  brand: BrandPreview;
};

export function BrandCard({ brand }: BrandCardProps) {
  const brandSlug = brand.slug ?? brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  return (
    <article className="brand-card">
      <FavoriteBrandButton brandName={brand.name} brandSlug={brandSlug} className="heart" />
      <Link className="brand-art" href={`${routes.brands}/${brandSlug}`}>
        {brand.code}
      </Link>
      <div className="location-pill">{brand.city}</div>
      <div className="brand-info">
        <h3>
          <Link href={`${routes.brands}/${brandSlug}`}>{brand.name}</Link>
        </h3>
        <p>
          {brand.category} · {formatDistance(brand.miles)} {brand.partnered ? "· Partnered" : ""}
        </p>
        <span className="rating">{formatRating(brand.rating)}</span>
      </div>
    </article>
  );
}
