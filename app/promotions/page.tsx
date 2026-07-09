import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function PromotionsPage() {
  return (
    <ThreadocalPage
      eyebrow="Promote and save"
      title="Promotions"
      intro="A starter promotions page for discount codes, giveaways, featured brand campaigns, and local deal alerts."
      cards={[
        { title: "Discount Codes", body: "Shoppers will find active brand codes and limited-time offers here." },
        { title: "Giveaways", body: "Brand-led giveaways and launch events can be highlighted in this area." },
        { title: "Featured Campaigns", body: "Paid promotion placements and seasonal campaigns will live here." },
      ]}
    />
  );
}
