import { SubscriptionDetails } from "@/features/subscriptions/components/subscription-details";

export default async function SubscriptionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubscriptionDetails id={id} />;
}
