import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function HowItWorksPage() {
  return (
    <ThreadocalPage
      eyebrow="Marketplace basics"
      title="How it works"
      intro="Threadocal helps shoppers discover independent clothing brands, support local businesses, and shop with confidence."
      cards={[
        { title: "Discover", body: "Search by city, ZIP code, category, promotion, or brand name." },
        { title: "Shop", body: "Explore products, save favorites, and buy from independent clothing brands." },
        { title: "Support Local", body: "Choose shipping or local pickup when brands make those options available." },
      ]}
    />
  );
}
