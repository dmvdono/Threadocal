import { BrandDashboardHome } from "@/components/dashboard/BrandDashboardHome";
import { BrandProfileEditor } from "@/components/dashboard/BrandProfileEditor";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandDashboardPage() {
  return (
    <ThreadocalPage
      eyebrow="Brand tools"
      title="Brand dashboard"
      intro="Workspace for independent clothing brands to manage profile, products, promotions, and marketplace activity."
      breadcrumbs={[{ label: "Brand Dashboard" }]}
      cards={[
        { title: "Brand Profile", body: "Save your storefront identity before uploading media or publishing products." },
        { title: "Promotions", body: "Upcoming discount codes, local deal alerts, and featured campaigns will be managed here." },
        { title: "Insights", body: "Profile views, customer interest, and sales signals will appear here as marketplace data grows." },
      ]}
    >
      <BrandProfileEditor />
      <BrandDashboardHome />
    </ThreadocalPage>
  );
}
