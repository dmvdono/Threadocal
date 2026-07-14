import { LoginForm } from "@/components/auth/LoginForm";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

type LoginPageProps = {
  searchParams: Promise<{ role?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <ThreadocalPage
      eyebrow="Welcome back"
      title="Log in to Threadocal"
      intro="Access saved brands, local drops, orders, and account tools from one place."
    >
      <LoginForm
        requestedRedirect={params.redirect ?? null}
        requestedRole={params.role === "brand_owner" ? "brand_owner" : "customer"}
      />
    </ThreadocalPage>
  );
}
