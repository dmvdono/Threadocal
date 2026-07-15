import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { OrderTrackingClient } from "@/components/orders/OrderTrackingClient";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    confirmed?: string;
  }>;
};

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const confirmed = (await searchParams)?.confirmed === "1";

  return (
    <ThreadocalPage
      eyebrow="Order tracking"
      title="Order Tracking"
      intro="Track shipping or local pickup fulfillment, confirm completion, or report an issue."
      breadcrumbs={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account#orders" }, { label: id }]}
    >
      <OrderTrackingClient confirmed={confirmed} orderId={id} />
    </ThreadocalPage>
  );
}
