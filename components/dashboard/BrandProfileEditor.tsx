"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  getBrandDashboardProfile,
  saveBrandDashboardProfile,
  uploadBrandDashboardAsset,
  type BrandProfileInput,
} from "@/services/brand-portal";

const emptyProfileForm: BrandProfileInput = {
  name: "",
  username: "",
  bio: "",
  logoUrl: "",
  bannerUrl: "",
  websiteUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  city: "",
  state: "",
  zipCode: "",
};

export function BrandProfileEditor() {
  const [form, setForm] = useState<BrandProfileInput>(emptyProfileForm);
  const [verified, setVerified] = useState(false);
  const [logoModerationStatus, setLogoModerationStatus] = useState("pending");
  const [bannerModerationStatus, setBannerModerationStatus] = useState("pending");
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"supabase" | "demo">("demo");

  useEffect(() => {
    async function loadProfile() {
      const result = await getBrandDashboardProfile();
      setMode(result.mode);

      if (result.brand) {
        setForm({
          name: result.brand.name ?? "",
          username: result.brand.slug ?? "",
          bio: result.brand.description ?? "",
          logoUrl: result.brand.logo_url ?? "",
          bannerUrl: result.brand.banner_url ?? "",
          websiteUrl: result.brand.website_url ?? "",
          instagramUrl: result.brand.instagram_url ?? "",
          tiktokUrl: result.brand.tiktok_url ?? "",
          youtubeUrl: result.brand.youtube_url ?? "",
          city: result.brand.city ?? "",
          state: result.brand.state ?? "",
          zipCode: result.brand.zip_code ?? "",
        });
        setVerified(result.brand.verified);
        setLogoModerationStatus(result.brand.logo_moderation_status);
        setBannerModerationStatus(result.brand.banner_moderation_status);
      }

      if (result.error) {
        setMessage(`Demo mode active: ${result.error}`);
      }
    }

    void loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.username.trim()) {
      setMessage("Brand name and username are required.");
      return;
    }

    const result = await saveBrandDashboardProfile(form);
    setMode(result.mode);
    setMessage(result.mode === "supabase" ? "Brand profile saved." : "Demo mode active. Profile was not saved to Supabase.");
  }

  async function handleAssetUpload(kind: "logo" | "banner", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);
    const result = await uploadBrandDashboardAsset(kind, file);
    setMode(result.mode);

    if (!result.brand) {
      setMessage(result.error ?? "Upload failed. Sign in with Supabase to upload images.");
      event.target.value = "";
      return;
    }

    setForm({
      ...form,
      logoUrl: result.brand.logo_url ?? form.logoUrl,
      bannerUrl: result.brand.banner_url ?? form.bannerUrl,
    });
    setLogoModerationStatus(result.brand.logo_moderation_status);
    setBannerModerationStatus(result.brand.banner_moderation_status);
    setMessage(`${kind === "logo" ? "Logo" : "Banner"} uploaded for admin review.`);
    event.target.value = "";
  }

  return (
    <section className="brand-profile-editor">
      <form className="portal-form" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Brand profile</p>
          <h2>Storefront identity</h2>
          <p className="option-note">
            {mode === "supabase" ? "Supabase profile data is active." : "Demo profile mode is active."}
          </p>
        </div>
        {message && <p className="auth-message success">{message}</p>}
        <div className="auth-form-grid">
          <label>
            Logo image
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => handleAssetUpload("logo", event)} type="file" />
            <span className="option-note">2MB max · {form.logoUrl ? `Review: ${logoModerationStatus}` : "No logo uploaded"}</span>
          </label>
          <label>
            Banner image
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => handleAssetUpload("banner", event)} type="file" />
            <span className="option-note">5MB max · {form.bannerUrl ? `Review: ${bannerModerationStatus}` : "No banner uploaded"}</span>
          </label>
          <label>
            Verified
            <input checked={verified} disabled type="checkbox" />
          </label>
        </div>
        <div className="auth-form-grid">
          <label>
            Brand name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Username
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </label>
          <label>
            Location
            <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </label>
        </div>
        <label>
          Bio
          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </label>
        <div className="auth-form-grid">
          <label>
            State
            <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} />
          </label>
          <label>
            ZIP code
            <input value={form.zipCode} onChange={(event) => setForm({ ...form, zipCode: event.target.value })} />
          </label>
          <label>
            Website
            <input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} />
          </label>
        </div>
        <div className="auth-form-grid">
          <label>
            Instagram
            <input value={form.instagramUrl} onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })} />
          </label>
          <label>
            TikTok
            <input value={form.tiktokUrl} onChange={(event) => setForm({ ...form, tiktokUrl: event.target.value })} />
          </label>
          <label>
            YouTube
            <input value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} />
          </label>
        </div>
        <button type="submit">Save Brand Profile</button>
      </form>
    </section>
  );
}
