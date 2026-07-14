import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { CheckoutPageClient } from "@/components/orders/CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <ThreadocalPage
      eyebrow="Checkout"
      title="Checkout"
      intro="Choose shipping or local pickup and complete payment with Stripe test mode."
      breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
    >
      <CheckoutPageClient />
    </ThreadocalPage>
  );
}
