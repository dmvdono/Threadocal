"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_UPDATED_EVENT, isFavoriteProduct, toggleFavoriteProduct } from "@/services/customer";

type FavoriteProductButtonProps = {
  productId: string;
  label?: string;
  className?: string;
};

export function FavoriteProductButton({ productId, label = "Favorite product", className }: FavoriteProductButtonProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    function syncFavorite() {
      setFavorite(isFavoriteProduct(productId));
    }

    syncFavorite();
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncFavorite);
    window.addEventListener("storage", syncFavorite);

    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncFavorite);
      window.removeEventListener("storage", syncFavorite);
    };
  }, [productId]);

  return (
    <button
      aria-pressed={favorite}
      aria-label={favorite ? `Remove ${label}` : label}
      className={`${className ?? "favorite-action"} ${favorite ? "active" : ""}`}
      onClick={() => setFavorite(toggleFavoriteProduct(productId))}
      type="button"
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}
