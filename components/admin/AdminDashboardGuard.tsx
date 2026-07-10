"use client";

import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export function AdminDashboardGuard() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      {() => (
        <ThreadocalPage
          breadcrumbs={[{ label: "Admin" }]}
          eyebrow="Operations"
          title="Admin dashboard"
          intro="Demo marketplace operations for approvals, disputes, product moderation, reports, and local audit activity."
        >
          <AdminDashboardClient />
        </ThreadocalPage>
      )}
    </AuthGuard>
  );
}
