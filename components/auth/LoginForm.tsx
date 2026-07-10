"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { getRedirectPathForRole, isDashboardRouteForRole, login } from "@/services/auth";
import { routes } from "@/utils/routes";
import { AuthMessage } from "@/components/auth/AuthMessage";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestedRedirect = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("redirect");
  }, []);
  const requestedRole = useMemo(() => {
    if (typeof window === "undefined") {
      return "customer";
    }

    return new URLSearchParams(window.location.search).get("role") === "brand_owner" ? "brand_owner" : "customer";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login({ email, password });

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    const redirectTo =
      requestedRedirect && isDashboardRouteForRole(requestedRedirect, result.profile.role)
        ? requestedRedirect
        : getRedirectPathForRole(result.profile.role);
    router.replace(redirectTo);
  }

  return (
    <section className="auth-panel">
      <form className="auth-form" method="post" onSubmit={handleSubmit}>
        <AuthMessage message={error} />
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
        <p>
          New to Threadocal?{" "}
          <Link className="secondary-link" href={`${routes.signup}?role=${requestedRole}`}>
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
