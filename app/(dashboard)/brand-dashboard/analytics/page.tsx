import { BrandAnalyticsClient } from "@/components/dashboard/BrandAnalyticsClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandAnalyticsPage() {
  return (
    <ThreadocalPage
      eyebrow="Analytics"
      title="Analytics"
      intro="Demo performance cards and simple CSS bars for brand sales, orders, views, and products."
      breadcrumbs={[{ label: "Brand Dashboard", href: "/brand-dashboard" }, { label: "Analytics" }]}
    >
      <BrandAnalyticsClient />
    </ThreadocalPage>
  );
}
