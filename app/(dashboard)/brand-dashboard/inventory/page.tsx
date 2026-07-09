import { BrandInventoryClient } from "@/components/dashboard/BrandInventoryClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandInventoryPage() {
  return (
    <ThreadocalPage
      eyebrow="Inventory"
      title="Inventory"
      intro="Track stock by product, size, and color in demo mode."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Inventory" }]}
    >
      <BrandInventoryClient />
    </ThreadocalPage>
  );
}
