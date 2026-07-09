"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredBrandSubmission } from "@/components/marketplace/BrandSubmissionForm";
import type { DemoBrandSubmission } from "@/types/brand";
import { routes } from "@/utils/routes";

export function BrandPreviewClient() {
  const [submission, setSubmission] = useState<DemoBrandSubmission | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSubmission(getStoredBrandSubmission());
    });
  }, []);

  if (!submission) {
    return (
      <section className="market-row">
        <article className="market-panel">
          <h2>No brand preview yet</h2>
          <p>Submit a demo brand profile first, then preview how it could appear in Threadocal.</p>
          <Link className="primary-link" href={routes.brandSubmit}>
            Submit a Brand
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="brand-preview">
      <article className="brand-preview-card">
        <div className="brand-preview-art">{submission.brandName.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className="eyebrow">{submission.category || "Independent clothing"}</p>
          <h2>{submission.brandName}</h2>
          <p>{submission.description || "Brand description will appear here."}</p>
          <div className="product-meta">
            <span>
              {submission.city || "City"}
              {submission.state ? `, ${submission.state}` : ""}
            </span>
            <span>{submission.pickupAvailable ? "Local pickup available" : "Shipping only for now"}</span>
          </div>
        </div>
      </article>
    </section>
  );
}
