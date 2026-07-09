"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import {
  deleteBrandProduct,
  getBrandProducts,
  saveBrandProduct,
  STANDARD_COLOR_OPTIONS,
  STANDARD_SIZE_OPTIONS,
  type BrandProductInput,
} from "@/services/brand-portal";
import type { BrandPortalProduct } from "@/types/product";
import { formatCents } from "@/utils/money";

const MIN_PRICE_CENTS = 1;
const MAX_PRICE_CENTS = 999999;

const emptyProductForm: BrandProductInput = {
  name: "",
  description: "",
  price: "2500",
  category: "menswear",
  sizes: ["S", "M", "L", "XL"],
  colors: ["Black", "White"],
  inventoryQuantity: "8",
  imagePlaceholder: "graphite",
  soldOut: false,
};

function productToForm(product: BrandPortalProduct): BrandProductInput {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: String(product.priceCents),
    category: product.category ?? "menswear",
    sizes: (product.sizes ?? []).filter((size) => STANDARD_SIZE_OPTIONS.includes(size)),
    colors: product.colors.filter((color) => STANDARD_COLOR_OPTIONS.includes(color)),
    inventoryQuantity: String(product.inventory[0]?.quantity ?? 0),
    imagePlaceholder: product.imagePlaceholder,
    soldOut: product.soldOut,
  };
}

export function BrandProductsClient() {
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);
  const [form, setForm] = useState<BrandProductInput>(emptyProductForm);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setProducts(getBrandProducts()));
  }, []);

  function resetForm() {
    setForm(emptyProductForm);
  }

  function getPriceCents() {
    return Math.min(MAX_PRICE_CENTS, Math.max(MIN_PRICE_CENTS, Number(form.price || MIN_PRICE_CENTS)));
  }

  function setPriceCents(priceCents: number) {
    setForm({
      ...form,
      price: String(Math.min(MAX_PRICE_CENTS, Math.max(MIN_PRICE_CENTS, Math.round(priceCents)))),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.price.trim()) {
      setMessage("Product name and price are required.");
      return;
    }

    if (form.sizes.length === 0 || form.colors.length === 0) {
      setMessage("Select at least one size and one color.");
      return;
    }

    saveBrandProduct(form);
    setProducts(getBrandProducts());
    setMessage(form.id ? "Product updated." : "Product added.");
    resetForm();
  }

  function handleDelete(productId: string) {
    setProducts(deleteBrandProduct(productId));
  }

  function toggleOption(field: "sizes" | "colors", value: string) {
    const selectedOptions = form[field];
    const nextOptions = selectedOptions.includes(value)
      ? selectedOptions.filter((option) => option !== value)
      : [...selectedOptions, value];

    setForm({ ...form, [field]: nextOptions });
  }

  return (
    <>
      <BrandPortalNav />
      <section className="portal-split">
        <form className="portal-form" onSubmit={handleSubmit}>
          <h2>{form.id ? "Edit product" : "Add product"}</h2>
          {message && <p className="auth-message success">{message}</p>}
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="auth-form-grid">
            <label className="price-slider">
              Price
              <strong>{formatCents(getPriceCents())}</strong>
              <input
                max={MAX_PRICE_CENTS}
                min={MIN_PRICE_CENTS}
                onChange={(event) => setPriceCents(Number(event.target.value))}
                step={1}
                type="range"
                value={getPriceCents()}
              />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BrandProductInput["category"] })}>
                <option value="menswear">Menswear</option>
                <option value="womenswear">Womenswear</option>
                <option value="kidswear">Kidswear</option>
                <option value="seasonal">Seasonal</option>
                <option value="sportswear">Sportswear</option>
                <option value="sale">Sale</option>
              </select>
            </label>
            <label>
              Image
              <input value={form.imagePlaceholder} onChange={(event) => setForm({ ...form, imagePlaceholder: event.target.value })} />
            </label>
          </div>
          <fieldset className="portal-option-field">
            <legend>Sizes</legend>
            <div className="portal-chip-grid">
              {STANDARD_SIZE_OPTIONS.map((size) => (
                <button
                  className={form.sizes.includes(size) ? "active" : ""}
                  key={size}
                  onClick={() => toggleOption("sizes", size)}
                  type="button"
                >
                  {size}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="portal-option-field">
            <legend>Colors</legend>
            <div className="portal-chip-grid">
              {STANDARD_COLOR_OPTIONS.map((color) => (
                <button
                  className={form.colors.includes(color) ? "active" : ""}
                  key={color}
                  onClick={() => toggleOption("colors", color)}
                  type="button"
                >
                  {color}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Starting inventory per size/color
            <input value={form.inventoryQuantity} onChange={(event) => setForm({ ...form, inventoryQuantity: event.target.value })} />
          </label>
          <label className="inline-check">
            <input checked={form.soldOut} type="checkbox" onChange={(event) => setForm({ ...form, soldOut: event.target.checked })} />
            Sold out
          </label>
          <button type="submit">{form.id ? "Save Product" : "Add Product"}</button>
          {form.id && (
            <button className="secondary-action" onClick={resetForm} type="button">
              Cancel Edit
            </button>
          )}
        </form>

        <div className="portal-list">
          {products.map((product) => (
            <article className="portal-list-item" key={product.id}>
              <div>
                <p className="eyebrow">{product.category}</p>
                <h2>{product.name}</h2>
                <p>{formatCents(product.priceCents)} · {product.soldOut ? "Sold out" : "Active"}</p>
              </div>
              <div className="portal-row-actions">
                <button onClick={() => setForm(productToForm(product))} type="button">Edit</button>
                <button onClick={() => handleDelete(product.id)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
