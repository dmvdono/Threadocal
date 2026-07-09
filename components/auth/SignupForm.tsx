"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { SignupInput } from "@/types/auth";
import { signup } from "@/services/auth";
import { routes } from "@/utils/routes";
import { AuthMessage } from "@/components/auth/AuthMessage";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<SignupInput>(() => {
    const type =
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("type");

    return {
      role: type === "brand_owner" ? "brand_owner" : "customer",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      city: "",
      state: "",
      zipCode: "",
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateForm<Key extends keyof SignupInput>(key: Key, value: SignupInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signup(form);

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.replace(result.redirectTo);
  }

  return (
    <section className="auth-panel">
      <form className="auth-form" method="post" onSubmit={handleSubmit}>
        <AuthMessage message={error} />

        <fieldset className="account-type">
          <legend>Account type</legend>
          <label>
            <input
              checked={form.role === "customer"}
              name="role"
              onChange={() => updateForm("role", "customer")}
              type="radio"
              value="customer"
            />
            Customer
          </label>
          <label>
            <input
              checked={form.role === "brand_owner"}
              name="role"
              onChange={() => updateForm("role", "brand_owner")}
              type="radio"
              value="brand_owner"
            />
            Brand owner
          </label>
        </fieldset>

        <label>
          Full name
          <input
            autoComplete="name"
            name="fullName"
            onChange={(event) => updateForm("fullName", event.target.value)}
            placeholder="Your name"
            required
            value={form.fullName}
          />
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={form.email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={(event) => updateForm("password", event.target.value)}
            placeholder="Create a password"
            required
            type="password"
            value={form.password}
          />
        </label>
        <label>
          Confirm password
          <input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            onChange={(event) => updateForm("confirmPassword", event.target.value)}
            placeholder="Confirm your password"
            required
            type="password"
            value={form.confirmPassword}
          />
        </label>
        <div className="auth-form-grid">
          <label>
            City
            <input
              autoComplete="address-level2"
              name="city"
              onChange={(event) => updateForm("city", event.target.value)}
              placeholder="City"
              value={form.city}
            />
          </label>
          <label>
            State
            <input
              autoComplete="address-level1"
              maxLength={2}
              name="state"
              onChange={(event) => updateForm("state", event.target.value.toUpperCase())}
              placeholder="State"
              value={form.state}
            />
          </label>
          <label>
            ZIP code
            <input
              autoComplete="postal-code"
              inputMode="numeric"
              name="zipCode"
              onChange={(event) => updateForm("zipCode", event.target.value)}
              placeholder="ZIP"
              value={form.zipCode}
            />
          </label>
        </div>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </button>
        <p>
          Already have an account?{" "}
          <Link className="secondary-link" href={routes.login}>
            Log in
          </Link>
        </p>
      </form>
    </section>
  );
}
