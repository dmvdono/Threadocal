import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { ThreadocalPage } from "@/components/layout/ThreadocalPage";

export default function AdminPage() {
  return (
    <ThreadocalPage
      breadcrumbs={[{ label: "Admin" }]}
      eyebrow="Operations"
      title="Admin dashboard"
      intro="Demo marketplace operations for approvals, disputes, product moderation, reports, and local audit activity."
    >
      <AdminDashboardClient />
    </ThreadocalPage>
  );
}
