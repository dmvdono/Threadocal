import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { BrandPortalNav } from "@/components/dashboard/BrandPortalNav";
import { BrandOrdersClient } from "@/components/orders/BrandOrdersClient";

export default function BrandOrdersPage() {
  return (
    <ThreadocalPage
      eyebrow="Demo brand fulfillment"
      title="Brand Orders"
      intro="Manage local demo orders from this browser. Brands can move orders through preparation and mark pickup orders ready."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Orders" }]}
    >
      <BrandPortalNav />
      <BrandOrdersClient />
    </ThreadocalPage>
  );
}
