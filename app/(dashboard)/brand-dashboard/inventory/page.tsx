import { BrandInventoryClient } from "@/components/dashboard/BrandInventoryClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandInventoryPage() {
  return (
    <ThreadocalPage
      eyebrow="Inventory"
      title="Inventory"
      intro="Track Supabase inventory by product, size, and color."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Inventory" }]}
    >
      <BrandInventoryClient />
    </ThreadocalPage>
  );
}
