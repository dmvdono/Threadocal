"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  canReviewProduct,
  CUSTOMER_UPDATED_EVENT,
  getReviewsForProduct,
  saveProductReview,
  type DemoProductReview,
} from "@/services/customer";

type ProductReviewsClientProps = {
  productId: string;
};

export function ProductReviewsClient({ productId }: ProductReviewsClientProps) {
  const [reviews, setReviews] = useState<DemoProductReview[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [reviewAllowed, setReviewAllowed] = useState(false);

  useEffect(() => {
    function syncReviews() {
      setReviews(getReviewsForProduct(productId));
      setReviewAllowed(canReviewProduct(productId));
    }

    queueMicrotask(syncReviews);
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncReviews);
    window.addEventListener("storage", syncReviews);

    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncReviews);
      window.removeEventListener("storage", syncReviews);
    };
  }, [productId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return null;
    }

    const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
    return Number(average.toFixed(1));
  }, [reviews]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reviewAllowed) {
      setMessage("Only completed demo purchases can be reviewed.");
      return;
    }

    if (!body.trim()) {
      setMessage("Please write a short review.");
      return;
    }

    saveProductReview({ productId, rating, body });
    setBody("");
    setMessage("Review saved locally.");
    setReviews(getReviewsForProduct(productId));
  }

  return (
    <section className="reviews-panel" aria-label="Product reviews">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2>{averageRating ? `${averageRating} / 5 average` : "Ratings placeholder"}</h2>
        </div>
        <span className="rating-count">{reviews.length} local reviews</span>
      </div>

      <div className="review-list">
        {reviews.length === 0 ? (
          <p>No completed-purchase reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id}>
              <strong>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</strong>
              <p>{review.body}</p>
            </article>
          ))
        )}
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <label>
          Rating
          <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Written review
          <textarea value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button className="primary-link" type="submit" disabled={!reviewAllowed}>
          Save Review
        </button>
        {!reviewAllowed && <p className="option-note">Complete a demo order with this item before reviewing it.</p>}
        {message && <p className="auth-message success">{message}</p>}
      </form>
    </section>
  );
}
