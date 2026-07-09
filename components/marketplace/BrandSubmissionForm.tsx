"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { defaultBrandSubmission } from "@/lib/demo/marketplace";
import { addBrandToApprovalQueue } from "@/services/admin";
import type { DemoBrandSubmission } from "@/types/brand";
import { routes } from "@/utils/routes";
import { AuthMessage } from "@/components/auth/AuthMessage";

const BRAND_SUBMISSION_STORAGE_KEY = "threadocal-demo-brand-submission";

export function getStoredBrandSubmission() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedSubmission = window.localStorage.getItem(BRAND_SUBMISSION_STORAGE_KEY);
    return storedSubmission ? (JSON.parse(storedSubmission) as DemoBrandSubmission) : null;
  } catch {
    return null;
  }
}

export function BrandSubmissionForm() {
  const router = useRouter();
  const [form, setForm] = useState<DemoBrandSubmission>(defaultBrandSubmission);
  const [error, setError] = useState<string | null>(null);

  function updateForm<Key extends keyof DemoBrandSubmission>(key: Key, value: DemoBrandSubmission[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.brandName.trim() || !form.ownerName.trim() || !form.email.trim()) {
      setError("Brand name, owner name, and email are required.");
      return;
    }

    window.localStorage.setItem(BRAND_SUBMISSION_STORAGE_KEY, JSON.stringify(form));
    addBrandToApprovalQueue(form);
    router.push(routes.brandPreview);
  }

  return (
    <section className="auth-panel">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthMessage message={error} />
        <label>
          Brand name
          <input
            onChange={(event) => updateForm("brandName", event.target.value)}
            placeholder="Your clothing brand"
            required
            value={form.brandName}
          />
        </label>
        <label>
          Owner name
          <input
            onChange={(event) => updateForm("ownerName", event.target.value)}
            placeholder="Your name"
            required
            value={form.ownerName}
          />
        </label>
        <label>
          Email
          <input
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="owner@example.com"
            required
            type="email"
            value={form.email}
          />
        </label>
        <div className="auth-form-grid">
          <label>
            City
            <input
              onChange={(event) => updateForm("city", event.target.value)}
              placeholder="City"
              value={form.city}
            />
          </label>
          <label>
            State
            <input
              maxLength={2}
              onChange={(event) => updateForm("state", event.target.value.toUpperCase())}
              placeholder="State"
              value={form.state}
            />
          </label>
          <label>
            Category
            <input
              onChange={(event) => updateForm("category", event.target.value)}
              placeholder="Streetwear"
              value={form.category}
            />
          </label>
        </div>
        <label>
          Brand description
          <textarea
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Tell shoppers what makes your brand different."
            value={form.description}
          />
        </label>
        <label className="inline-check">
          <input
            checked={form.pickupAvailable}
            onChange={(event) => updateForm("pickupAvailable", event.target.checked)}
            type="checkbox"
          />
          Local pickup available
        </label>
        <button type="submit">Preview Brand Profile</button>
      </form>
    </section>
  );
}
