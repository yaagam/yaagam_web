import { TempleDetailsPanel } from "@/components/admin/TempleDetailsPanel";

export default async function TempleDetailsPage({
  params,
}: PageProps<"/admin/temples/[id]">) {
  const { id } = await params;

  return <TempleDetailsPanel templeId={id} />;
}
