import { BenifitDetailsPanel } from "@/components/admin/BenifitDetailsPanel";

export default async function BenifitDetailsPage({
  params,
}: PageProps<"/admin/benifits/[id]">) {
  const { id } = await params;

  return <BenifitDetailsPanel benifitId={id} />;
}
