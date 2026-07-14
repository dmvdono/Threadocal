import { Suspense } from "react";
import { CheckoutSuccessClient } from "@/components/orders/CheckoutSuccessClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function CheckoutSuccessPage() {
  return (
    <ThreadocalPage
      eyebrow="Checkout"
      title="ORDER STATUS"
      intro="Threadocal is confirming your Stripe test-mode checkout and preparing your order tracking page."
    >
      <Suspense fallback={<p>Confirming checkout...</p>}>
        <CheckoutSuccessClient />
      </Suspense>
    </ThreadocalPage>
  );
}
