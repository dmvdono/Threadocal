import { BrandProductsClient } from "@/components/dashboard/BrandProductsClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandProductsPage() {
  return (
    <ThreadocalPage
      eyebrow="Product management"
      title="Products"
      intro="Add, edit, duplicate, and remove Supabase-backed marketplace products."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Products" }]}
    >
      <BrandProductsClient />
    </ThreadocalPage>
  );
}
