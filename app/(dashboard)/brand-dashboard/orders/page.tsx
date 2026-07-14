import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import { BrandOrdersClient } from "@/components/orders/BrandOrdersClient";

export default function BrandOrdersPage() {
  return (
    <ThreadocalPage
      eyebrow="Brand fulfillment"
      title="Brand Orders"
      intro="Manage paid Supabase orders through pickup and shipping fulfillment."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Orders" }]}
    >
      <BrandPortalNav />
      <BrandOrdersClient />
    </ThreadocalPage>
  );
}
