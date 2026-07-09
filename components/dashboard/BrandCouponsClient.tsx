"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import {
  deleteBrandCoupon,
  getBrandCoupons,
  saveBrandCoupon,
  type BrandCouponInput,
} from "@/services/brand-portal";
import type { BrandCoupon } from "@/types/product";

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createEmptyCouponForm(): BrandCouponInput {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);

  return {
    code: "",
    description: "",
    discountType: "percent",
    amount: "10",
    startsAt: getDateInputValue(startDate),
    endsAt: getDateInputValue(endDate),
    active: true,
  };
}

function couponToForm(coupon: BrandCoupon): BrandCouponInput {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    amount: String(coupon.amount),
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    active: coupon.active,
  };
}

export function BrandCouponsClient() {
  const [coupons, setCoupons] = useState<BrandCoupon[]>([]);
  const [form, setForm] = useState<BrandCouponInput>(() => createEmptyCouponForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setCoupons(getBrandCoupons()));
  }, []);

  function resetForm() {
    setForm(createEmptyCouponForm());
  }

  function updateDiscountType(discountType: BrandCouponInput["discountType"]) {
    let amount = form.amount;

    if (discountType === "free_pickup") {
      amount = "0";
    } else if (discountType === "percent" && (Number(amount) < 1 || Number(amount) > 100)) {
      amount = "10";
    } else if (discountType === "fixed" && Number(amount) <= 0) {
      amount = "5";
    }

    setForm({ ...form, amount, discountType });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const today = getDateInputValue(new Date());

    if (!form.code.trim() || !form.discountType || !form.startsAt || !form.endsAt) {
      setError("Coupon code, discount type, start date, and end date are required.");
      return;
    }

    if (form.startsAt < today || form.endsAt < today) {
      setError("Start date and end date cannot be in the past.");
      return;
    }

    if (form.endsAt < form.startsAt) {
      setError("End date must be after start date.");
      return;
    }

    if (form.discountType === "percent" && (!form.amount.trim() || Number(form.amount) < 1 || Number(form.amount) > 100)) {
      setError("Percent off must be between 1% and 100%.");
      return;
    }

    if (form.discountType === "fixed" && (!form.amount.trim() || Number(form.amount) <= 0)) {
      setError("Discount amount must be greater than zero.");
      return;
    }

    saveBrandCoupon(form);
    setCoupons(getBrandCoupons());
    resetForm();
  }

  return (
    <>
      <BrandPortalNav />
      <section className="portal-split">
        <form className="portal-form" onSubmit={handleSubmit}>
          <h2>{form.id ? "Edit coupon" : "Create coupon"}</h2>
          {error && <p className="auth-message error">{error}</p>}
          <label>Code<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
          <label>Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label>
            Discount type
            <select value={form.discountType} onChange={(event) => updateDiscountType(event.target.value as BrandCouponInput["discountType"])}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="free_pickup">Free pickup</option>
            </select>
          </label>
          {form.discountType === "percent" && (
            <label className="price-slider">
              Percent off
              <strong>{form.amount || "1"}%</strong>
              <input
                max={100}
                min={1}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                step={1}
                type="range"
                value={Math.min(100, Math.max(1, Number(form.amount || 1)))}
              />
            </label>
          )}
          {form.discountType === "fixed" && (
            <label>
              Fixed amount off
              <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            </label>
          )}
          {form.discountType === "free_pickup" && <p className="option-note">Free pickup coupons do not need a discount amount.</p>}
          <div className="auth-form-grid">
            <label>Start<input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
            <label>End<input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label>
          </div>
          <label className="inline-check">
            <input checked={form.active} type="checkbox" onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
          <button type="submit">{form.id ? "Save Coupon" : "Create Coupon"}</button>
          {form.id && <button className="secondary-action" onClick={resetForm} type="button">Cancel Edit</button>}
        </form>
        <div className="portal-list">
          {coupons.map((coupon) => (
            <article className="portal-list-item" key={coupon.id}>
              <div>
                <p className="eyebrow">{coupon.active ? "Active" : "Inactive"}</p>
                <h2>{coupon.code}</h2>
                <p>{coupon.discountType.replace("_", " ")} · {coupon.amount}{coupon.discountType === "percent" ? "%" : ""}</p>
              </div>
              <div className="portal-row-actions">
                <button onClick={() => setForm(couponToForm(coupon))} type="button">Edit</button>
                <button onClick={() => setCoupons(deleteBrandCoupon(coupon.id))} type="button">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
