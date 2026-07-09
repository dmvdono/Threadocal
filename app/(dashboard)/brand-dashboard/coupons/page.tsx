import { BrandCouponsClient } from "@/components/dashboard/BrandCouponsClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandCouponsPage() {
  return (
    <ThreadocalPage
      eyebrow="Coupons"
      title="Coupons"
      intro="Create and manage demo promotion codes with localStorage persistence."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Coupons" }]}
    >
      <BrandCouponsClient />
    </ThreadocalPage>
  );
}
