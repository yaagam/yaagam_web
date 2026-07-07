import { PoojaDetailsPanel } from "@/components/admin/PoojaDetailsPanel";

export default async function PoojaDetailsPage({
  params,
}: PageProps<"/[lang]/admin/poojas/[id]">) {
  const { id } = await params;

  return <PoojaDetailsPanel poojaId={id} />;
}
