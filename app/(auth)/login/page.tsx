import { LoginForm } from "@/components/auth/LoginForm";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function LoginPage() {
  return (
    <ThreadocalPage
      eyebrow="Welcome back"
      title="Log in to Threadocal"
      intro="Access saved brands, local drops, orders, and account tools from one place."
    >
      <LoginForm />
    </ThreadocalPage>
  );
}
