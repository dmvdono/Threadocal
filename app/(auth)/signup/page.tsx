import { SignupForm } from "@/components/auth/SignupForm";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function SignupPage() {
  return (
    <ThreadocalPage
      eyebrow="Join Threadocal"
      title="Create your account"
      intro="Start saving brands, tracking local releases, and unlocking promotions from independent clothing labels."
    >
      <SignupForm />
    </ThreadocalPage>
  );
}
