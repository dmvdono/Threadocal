"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_UPDATED_EVENT, isFavoriteBrand, toggleFavoriteBrand } from "@/services/customer";

type FavoriteBrandButtonProps = {
  brandSlug: string;
  brandName: string;
  className?: string;
  showText?: boolean;
};

export function FavoriteBrandButton({ brandSlug, brandName, className, showText = false }: FavoriteBrandButtonProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    function syncFavorite() {
      setFavorite(isFavoriteBrand(brandSlug));
    }

    syncFavorite();
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncFavorite);
    window.addEventListener("storage", syncFavorite);

    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncFavorite);
      window.removeEventListener("storage", syncFavorite);
    };
  }, [brandSlug]);

  return (
    <button
      aria-pressed={favorite}
      aria-label={favorite ? `Unfollow ${brandName}` : `Follow ${brandName}`}
      className={`${className ?? "favorite-action"} ${favorite ? "active" : ""}`}
      onClick={() => setFavorite(toggleFavoriteBrand(brandSlug))}
      type="button"
    >
      {showText ? (favorite ? "Following" : "Follow brand") : favorite ? "♥" : "♡"}
    </button>
  );
}
