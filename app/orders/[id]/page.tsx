import { ThreadocalPage } from "@/components/layout/ThreadocalPage";
import { OrderTrackingClient } from "@/components/orders/OrderTrackingClient";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return (
    <ThreadocalPage
      eyebrow="Order tracking"
      title="Order Tracking"
      intro="Track shipping or local pickup fulfillment, confirm completion, or report an issue."
      breadcrumbs={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account#orders" }, { label: id }]}
    >
      <OrderTrackingClient orderId={id} />
    </ThreadocalPage>
  );
}
