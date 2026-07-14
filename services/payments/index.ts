type StripeRequestOptions = {
  method?: "GET" | "POST";
  body?: URLSearchParams;
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add a Stripe test-mode secret key before creating checkout sessions.");
  }

  if (!key.startsWith("sk_test_") && process.env.ALLOW_STRIPE_LIVE_MODE !== "true") {
    throw new Error("Threadocal checkout is locked to Stripe test mode. Use sk_test_ or set ALLOW_STRIPE_LIVE_MODE=true intentionally.");
  }

  return key;
}

export async function stripeRequest<T>(path: string, options: StripeRequestOptions = {}) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: options.body,
  });

  const data = await response.json();

  if (!response.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "Stripe request failed.";
    throw new Error(message);
  }

  return data as T;
}

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  payment_intent: string | null;
  metadata?: Record<string, string>;
};
