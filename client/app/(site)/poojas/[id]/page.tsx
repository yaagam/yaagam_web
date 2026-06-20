import { PoojaDetailsView } from "@/components/blocks/PoojaDetailsView";

export default async function PoojaDetailsPage({
  params,
}: PageProps<"/poojas/[id]">) {
  const { id } = await params;

  return <PoojaDetailsView poojaId={id} />;
}