import { ProtectedDashboardPage } from "@/components/dashboard/ProtectedDashboardPage";

export default function DashboardPage() {
  return (
    <ProtectedDashboardPage
      allowedRoles={["customer"]}
      eyebrow="Customer dashboard"
      title="Your Threadocal hub"
      intro="A starter dashboard for saved brands, recent orders, rewards, and local clothing drops."
      cards={[
        { title: "Saved Brands", body: "Keep track of independent labels you want to revisit." },
        { title: "Orders", body: "Future order status, pickup details, and purchase history will live here." },
        { title: "Rewards", body: "Loyalty perks, referrals, and promotion unlocks will appear here." },
      ]}
    />
  );
}
