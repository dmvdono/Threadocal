import { CartPageClient } from "@/components/cart/CartPageClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function CartPage() {
  return (
    <ThreadocalPage
      eyebrow="Demo cart"
      title="Cart"
      intro="Review demo products stored in localStorage. Checkout, payments, order holds, and pickup scheduling will connect later."
      breadcrumbs={[{ label: "Cart" }]}
    >
      <CartPageClient />
    </ThreadocalPage>
  );
}
