import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { CheckoutPageClient } from "@/components/orders/CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <ThreadocalPage
      eyebrow="Demo checkout"
      title="Checkout"
      intro="Place a local demo order with shipping or pickup details stored in this browser."
      breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
    >
      <CheckoutPageClient />
    </ThreadocalPage>
  );
}
