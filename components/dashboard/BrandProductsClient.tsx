"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import {
  deleteBrandDashboardProduct,
  duplicateBrandDashboardProduct,
  getBrandDashboardProducts,
  saveBrandDashboardProduct,
  STANDARD_COLOR_OPTIONS,
  STANDARD_SIZE_OPTIONS,
  uploadBrandDashboardProductImages,
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
  salePrice: "",
  category: "menswear",
  tags: [],
  sizes: ["S", "M", "L", "XL"],
  colors: ["Black", "White"],
  sku: "",
  inventoryQuantity: "8",
  imageUrls: [""],
  releaseDate: "",
  status: "draft",
};

function productToForm(product: BrandPortalProduct): BrandProductInput {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: String(product.priceCents),
    salePrice: product.salePriceCents ? String(product.salePriceCents) : "",
    category: product.category ?? "menswear",
    tags: product.tags ?? [],
    sizes: (product.sizes ?? []).filter((size) => STANDARD_SIZE_OPTIONS.includes(size)),
    colors: product.colors.filter((color) => STANDARD_COLOR_OPTIONS.includes(color)),
    sku: product.inventory[0]?.sku ?? "",
    inventoryQuantity: String(product.inventory[0]?.quantity ?? 0),
    imageUrls: product.imageUrls?.length ? product.imageUrls : [product.imagePlaceholder],
    releaseDate: product.releaseDate ?? "",
    status: product.status === "draft" ? "draft" : "published",
  };
}

export function BrandProductsClient() {
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);
  const [form, setForm] = useState<BrandProductInput>(emptyProductForm);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"supabase" | "demo">("demo");

  useEffect(() => {
    async function loadProducts() {
      const result = await getBrandDashboardProducts();
      setProducts(result.products);
      setMode(result.mode);

      if (result.error) {
        setMessage(`Demo mode active: ${result.error}`);
      }
    }

    void loadProducts();
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const result = await saveBrandDashboardProduct(form);
    setProducts(result.products);
    setMode(result.mode);
    setMessage(`${form.id ? "Product updated" : "Product added"}${result.mode === "demo" ? " in demo mode" : ""}.`);
    resetForm();
  }

  async function handleDelete(productId: string) {
    const result = await deleteBrandDashboardProduct(productId);
    setProducts(result.products);
    setMode(result.mode);
    setMessage(result.mode === "demo" ? "Product deleted in demo mode." : "Product deleted.");
  }

  async function handleDuplicate(productId: string) {
    const result = await duplicateBrandDashboardProduct(productId);
    setProducts(result.products);
    setMode(result.mode);
    setMessage(result.mode === "demo" ? "Product duplicated in demo mode." : "Product duplicated.");
  }

  function toggleOption(field: "sizes" | "colors", value: string) {
    const selectedOptions = form[field];
    const nextOptions = selectedOptions.includes(value)
      ? selectedOptions.filter((option) => option !== value)
      : [...selectedOptions, value];

    setForm({ ...form, [field]: nextOptions });
  }

  function updateTags(value: string) {
    setForm({ ...form, tags: value.split(",").map((tag) => tag.trim()).filter(Boolean) });
  }

  function getInventoryTotal(product: BrandPortalProduct) {
    return product.inventory.reduce((total, variant) => total + variant.quantity, 0);
  }

  async function handleProductImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setMessage(null);

    try {
      const uploadedUrls = await uploadBrandDashboardProductImages(files);
      setForm({ ...form, imageUrls: [...form.imageUrls.filter(Boolean), ...uploadedUrls] });
      setMessage(`${uploadedUrls.length} product image${uploadedUrls.length === 1 ? "" : "s"} uploaded for admin review.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product image upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <BrandPortalNav />
      <section className="portal-split">
        <form className="portal-form" onSubmit={handleSubmit}>
          <h2>{form.id ? "Edit product" : "Create product"}</h2>
          {message && <p className="auth-message success">{message}</p>}
          <p className="option-note">
            {mode === "supabase" ? "Supabase marketplace data is active." : "Demo marketplace data is active."}
          </p>
          <label>
            Product name
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
              Sale price
              <input
                inputMode="numeric"
                value={form.salePrice}
                onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
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
          </div>
          <label>
            Product images
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              onChange={handleProductImageUpload}
              type="file"
            />
            <span className="option-note">5MB max per image · uploaded images require admin approval before public display</span>
          </label>
          {form.imageUrls.filter(Boolean).length > 0 && (
            <div className="portal-list-item">
              <div>
                <strong>{form.imageUrls.filter(Boolean).length} image{form.imageUrls.filter(Boolean).length === 1 ? "" : "s"} ready</strong>
                <span>Saving this product will queue them as pending.</span>
              </div>
              <button type="button" onClick={() => setForm({ ...form, imageUrls: [] })}>
                Clear Images
              </button>
            </div>
          )}
          <div className="auth-form-grid">
            <label>
              SKU
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
            </label>
            <label>
              Release date
              <input type="date" value={form.releaseDate} onChange={(event) => setForm({ ...form, releaseDate: event.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BrandProductInput["status"] })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label>
            Tags
            <input
              placeholder="streetwear, hoodie, local pickup"
              value={form.tags.join(", ")}
              onChange={(event) => updateTags(event.target.value)}
            />
          </label>
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
          <button type="submit">{form.id ? "Save Product" : "Add Product"}</button>
          {form.id && (
            <button className="secondary-action" onClick={resetForm} type="button">
              Cancel Edit
            </button>
          )}
        </form>

        <div className="portal-product-grid">
          {products.map((product) => (
            <article className="portal-product-card" key={product.id}>
              <div className={`portal-product-image tone-${product.imageUrls?.[0] ? "graphite" : product.imageTone ?? "graphite"}`}>
                {product.imageUrls?.[0] ? <img src={product.imageUrls[0]} alt={product.name} /> : <span>{product.name.slice(0, 2)}</span>}
              </div>
              <div>
                <p className="eyebrow">{product.category}</p>
                <h2>{product.name}</h2>
                <p>{formatCents(product.salePriceCents ?? product.priceCents)} · {product.status}</p>
                <p>{getInventoryTotal(product)} in stock</p>
              </div>
              <div className="portal-row-actions">
                <button onClick={() => setForm(productToForm(product))} type="button">Edit</button>
                <button onClick={() => handleDuplicate(product.id)} type="button">Duplicate</button>
                <button onClick={() => handleDelete(product.id)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
