import type { Metadata } from "next";

import { PoojaBookingView } from "@/components/blocks/PoojaBookingView";

export const metadata: Metadata = {
  title: "Book Pooja | Yaagam",
  robots: {
    index: false,
    follow: false,
  },
};

type PoojaBookingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string | string[] }>;
};

export default async function PoojaBookingPage({
  params,
  searchParams,
}: PoojaBookingPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const plan = Array.isArray(query.plan) ? query.plan[0] : query.plan;

  return <PoojaBookingView poojaId={id} plan={plan} />;
}