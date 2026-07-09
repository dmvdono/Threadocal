"use client";

import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

type SignupErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function SignupErrorPage({ error, reset }: SignupErrorPageProps) {
  return (
    <ThreadocalPage
      eyebrow="Signup issue"
      title="Create your account"
      intro="Something interrupted signup. Try again, and if it keeps happening, check your Supabase project settings."
    >
      <section className="auth-panel">
        <div className="auth-form">
          <p className="auth-message error" role="alert">
            {error.message || "Unable to load signup."}
          </p>
          <button onClick={reset} type="button">
            Try Again
          </button>
        </div>
      </section>
    </ThreadocalPage>
  );
}
