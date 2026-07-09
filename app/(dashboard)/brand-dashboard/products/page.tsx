import { BrandProductsClient } from "@/components/dashboard/BrandProductsClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandProductsPage() {
  return (
    <ThreadocalPage
      eyebrow="Product management"
      title="Products"
      intro="Add, edit, and remove demo products with localStorage persistence."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Products" }]}
    >
      <BrandProductsClient />
    </ThreadocalPage>
  );
}
