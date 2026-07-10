"use client";

import { useEffect, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import { getBrandDashboardProducts, updateBrandDashboardInventoryQuantity } from "@/services/brand-portal";
import type { BrandPortalProduct } from "@/types/product";

export function BrandInventoryClient() {
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const result = await getBrandDashboardProducts();
      setProducts(result.products);

      if (result.error) {
        setMessage(result.mode === "demo" ? `Demo mode active: ${result.error}` : result.error);
      }
    }

    void loadProducts();
  }, []);

  async function adjustQuantity(productId: string, variantId: string, quantity: number) {
    const result = await updateBrandDashboardInventoryQuantity(productId, variantId, quantity);
    setProducts(result.products);

    if (result.error) {
      setMessage(result.mode === "demo" ? `Demo mode active: ${result.error}` : result.error);
    }
  }

  return (
    <>
      <BrandPortalNav />
      <section className="portal-table-wrap">
        {message && <p className="auth-message success">{message}</p>}
        <table className="portal-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Color</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {products.flatMap((product) =>
              product.inventory.map((variant) => (
                <tr key={`${product.id}-${variant.id}`}>
                  <td>{product.name}</td>
                  <td>{variant.size}</td>
                  <td>{variant.color}</td>
                  <td>{variant.quantity}</td>
                  <td>
                    {variant.quantity === 0 ? "Sold out" : variant.quantity <= 3 ? "Low stock" : "In stock"}
                  </td>
                  <td>
                    <div className="quantity-stepper">
                      <button onClick={() => adjustQuantity(product.id, variant.id, variant.quantity - 1)} type="button">-</button>
                      <span>{variant.quantity}</span>
                      <button onClick={() => adjustQuantity(product.id, variant.id, variant.quantity + 1)} type="button">+</button>
                    </div>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
