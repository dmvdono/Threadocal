import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { BrandSubmissionForm } from "@/components/marketplace/BrandSubmissionForm";

export default function BrandSubmitPage() {
  return (
    <ThreadocalPage
      eyebrow="Demo brand onboarding"
      title="Submit a Brand"
      intro="Create a local demo brand profile without Supabase Auth. This is a temporary localStorage flow for marketplace testing."
    >
      <BrandSubmissionForm />
    </ThreadocalPage>
  );
}
