import { SignupForm } from "@/components/auth/SignupForm";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

type SignupPageProps = {
  searchParams: Promise<{ role?: string; type?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const requestedRole = params.role ?? params.type;

  return (
    <ThreadocalPage
      eyebrow="Join Threadocal"
      title="Create your account"
      intro="Start saving brands, tracking local releases, and unlocking promotions from independent clothing labels."
    >
      <SignupForm initialRole={requestedRole === "brand_owner" ? "brand_owner" : "customer"} />
    </ThreadocalPage>
  );
}
