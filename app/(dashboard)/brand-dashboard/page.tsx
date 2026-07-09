import { BrandDashboardHome } from "@/components/dashboard/BrandDashboardHome";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function BrandDashboardPage() {
  return (
    <ThreadocalPage
      eyebrow="Brand tools"
      title="Brand dashboard"
      intro="Demo mode workspace for independent clothing brands to manage visibility, promotions, and local pickup activity without Supabase Auth."
      breadcrumbs={[{ label: "Brand Dashboard" }]}
      cards={[
        { title: "Brand Profile", body: "Demo brand profile tools will use localStorage until Supabase Auth resumes." },
        { title: "Promotions", body: "Upcoming discount codes, local deal alerts, and featured campaigns will be managed here." },
        { title: "Insights", body: "Demo analytics placeholders for profile views, customer interest, and sales signals." },
      ]}
    >
      <BrandDashboardHome />
    </ThreadocalPage>
  );
}
