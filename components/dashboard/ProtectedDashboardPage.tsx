"use client";

import type { UserRole } from "@/types/auth";
import type { StarterCard } from "@/types/threadocal";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

type ProtectedDashboardPageProps = {
  allowedRoles: UserRole[];
  eyebrow: string;
  title: string;
  intro: string;
  cards: StarterCard[];
};

export function ProtectedDashboardPage({
  allowedRoles,
  eyebrow,
  title,
  intro,
  cards,
}: ProtectedDashboardPageProps) {
  const [notice] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("notice") === "wrong-role"
      ? "You were redirected to the dashboard that matches your account type."
      : null;
  });

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      {(profile) => (
        <ThreadocalPage eyebrow={eyebrow} title={title} intro={`${intro} Signed in as ${profile.full_name}.`} cards={cards}>
          {notice && (
            <section className="auth-panel">
              <p className="auth-message success" role="status">
                {notice}
              </p>
            </section>
          )}
          <section className="dashboard-account">
            <div>
              <p className="eyebrow">Account</p>
              <h2>{profile.full_name}</h2>
              <p>
                Role: <strong>{profile.role}</strong>
              </p>
            </div>
            <LogoutButton />
          </section>
        </ThreadocalPage>
      )}
    </AuthGuard>
  );
}
