"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getBrandDashboardProfile,
  MARKETPLACE_IMAGE_MAX_BYTES,
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

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function selectedFileCopy(file: File | null) {
  return file ? `${file.name} · ${formatFileSize(file.size)}` : null;
}

export function BrandProfileEditor() {
  const [form, setForm] = useState<BrandProfileInput>(emptyProfileForm);
  const [verified, setVerified] = useState(false);
  const [logoModerationStatus, setLogoModerationStatus] = useState("pending");
  const [bannerModerationStatus, setBannerModerationStatus] = useState("pending");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"supabase" | "demo">("demo");
  const logoPreviewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  const bannerPreviewUrl = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : null), [bannerFile]);

  useEffect(() => {
    async function loadProfile() {
      const result = await getBrandDashboardProfile();
      setMode(result.mode);

      if (result.brand) {
        setForm({
          name: result.brand.name ?? "",
          username: result.brand.username ?? result.brand.slug ?? "",
          bio: result.brand.bio ?? result.brand.description ?? "",
          logoUrl: result.brand.logo_url ?? "",
          bannerUrl: result.brand.banner_url ?? "",
          websiteUrl: result.brand.website_url ?? "",
          instagramUrl: result.brand.instagram_url ?? "",
          tiktokUrl: result.brand.tiktok_url ?? "",
          youtubeUrl: result.brand.youtube_url ?? "",
          city: result.brand.city ?? result.brand.location ?? "",
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

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.username.trim()) {
      setMessage("Brand name and username are required.");
      return;
    }

    const result = await saveBrandDashboardProfile(form);
    setMode(result.mode);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    let savedBrand = result.brand;
    const uploadErrors: string[] = [];

    if (result.mode === "supabase" && logoFile) {
      const uploadResult = await uploadBrandDashboardAsset("logo", logoFile);
      setMode(uploadResult.mode);

      if (uploadResult.brand) {
        savedBrand = uploadResult.brand;
        setLogoFile(null);
      } else {
        uploadErrors.push(uploadResult.error ?? "Logo upload failed. Your previous logo was preserved.");
      }
    }

    if (result.mode === "supabase" && bannerFile) {
      const uploadResult = await uploadBrandDashboardAsset("banner", bannerFile);
      setMode(uploadResult.mode);

      if (uploadResult.brand) {
        savedBrand = uploadResult.brand;
        setBannerFile(null);
      } else {
        uploadErrors.push(uploadResult.error ?? "Banner upload failed. Your previous banner was preserved.");
      }
    }

    if (savedBrand) {
      setForm({
        ...form,
        logoUrl: savedBrand.logo_url ?? form.logoUrl,
        bannerUrl: savedBrand.banner_url ?? form.bannerUrl,
      });
      setLogoModerationStatus(savedBrand.logo_moderation_status);
      setBannerModerationStatus(savedBrand.banner_moderation_status);
    }

    if (uploadErrors.length > 0) {
      setMessage(uploadErrors.join(" "));
      return;
    }

    setMessage(
      result.mode === "supabase"
        ? "Brand profile saved. New images are pending admin review."
        : "Demo mode active. Profile was not saved to Supabase.",
    );
  }

  function handleAssetSelect(kind: "logo" | "banner", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);

    if (file.size > MARKETPLACE_IMAGE_MAX_BYTES) {
      setMessage("Image must be 25MB or smaller.");
      event.target.value = "";
      return;
    }

    if (kind === "logo") {
      setLogoFile(file);
    } else {
      setBannerFile(file);
    }

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
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => handleAssetSelect("logo", event)} type="file" />
            {(logoPreviewUrl || form.logoUrl) && (
              <span className="upload-preview">
                <img src={logoPreviewUrl ?? form.logoUrl} alt="Brand logo preview" />
              </span>
            )}
            <span className="option-note">25MB max · {selectedFileCopy(logoFile) ?? (form.logoUrl ? `Review: ${logoModerationStatus}` : "No logo uploaded")}</span>
          </label>
          <label>
            Banner image
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => handleAssetSelect("banner", event)} type="file" />
            {(bannerPreviewUrl || form.bannerUrl) && (
              <span className="upload-preview banner-preview">
                <img src={bannerPreviewUrl ?? form.bannerUrl} alt="Brand banner preview" />
              </span>
            )}
            <span className="option-note">25MB max · {selectedFileCopy(bannerFile) ?? (form.bannerUrl ? `Review: ${bannerModerationStatus}` : "No banner uploaded")}</span>
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
