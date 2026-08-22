import { PoojaTrackingPage } from "@/components/blocks/my-poojas/PoojaTrackingPage";

export default async function Page({
  params,
}: {
  params: Promise<{ bookingNumber: string }>;
}) {
  const { bookingNumber } = await params;
  return (
    <PoojaTrackingPage bookingNumber={decodeURIComponent(bookingNumber)} />
  );
}
