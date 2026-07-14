import { CartPageClient } from "@/components/cart/CartPageClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function CartPage() {
  return (
    <ThreadocalPage
      eyebrow="Cart"
      title="Cart"
      intro="Review marketplace products before Stripe test-mode checkout."
      breadcrumbs={[{ label: "Cart" }]}
    >
      <CartPageClient />
    </ThreadocalPage>
  );
}
