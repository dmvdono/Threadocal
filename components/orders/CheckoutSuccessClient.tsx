"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCart } from "@/services/cart";
import { createBrowserSupabaseClient } from "@/supabase/client";
import { routes } from "@/utils/routes";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("Confirming your Stripe test payment...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finalizeCheckout() {
      if (!sessionId) {
        setError("Missing Stripe checkout session.");
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session?.access_token) {
          throw new Error("Log in again to finish checkout reconciliation.");
        }

        const response = await fetch("/api/checkout/finalize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const payload = await response.json() as { orderId?: string; error?: string };

        if (!response.ok || !payload.orderId) {
          throw new Error(payload.error ?? "Threadocal could not finalize the order.");
        }

        clearCart();
        setOrderId(payload.orderId);
        setMessage("Payment confirmed. Your Threadocal order is ready to track.");
      } catch (finalizeError) {
        setError(finalizeError instanceof Error ? finalizeError.message : "Threadocal could not finalize checkout.");
      }
    }

    void finalizeCheckout();
  }, [sessionId]);

  return (
    <section className="market-row">
      <article className="market-panel">
        <p className="eyebrow">Checkout</p>
        <h2>{error ? "Checkout needs attention" : "Order confirmed"}</h2>
        <p>{error ?? message}</p>
        {orderId ? (
          <Link className="primary-link" href={`${routes.orders}/${orderId}`}>
            Track Order
          </Link>
        ) : (
          <Link className="secondary-link" href={routes.cart}>
            Back to Cart
          </Link>
        )}
      </article>
    </section>
  );
}
