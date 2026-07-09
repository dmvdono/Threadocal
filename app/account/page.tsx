import { CustomerAccountClient } from "@/components/customer/CustomerAccountClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function AccountPage() {
  return (
    <ThreadocalPage
      eyebrow="Customer experience"
      title="Account"
      intro="Demo customer dashboard for orders, favorites, addresses, notifications, recently viewed products, and reviews."
      breadcrumbs={[{ label: "Account" }]}
    >
      <CustomerAccountClient />
    </ThreadocalPage>
  );
}
