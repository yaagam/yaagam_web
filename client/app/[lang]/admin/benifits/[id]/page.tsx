import { BenifitDetailsPanel } from "@/components/admin/BenifitDetailsPanel";

export default async function BenifitDetailsPage({
  params,
}: PageProps<"/[lang]/admin/benifits/[id]">) {
  const { id } = await params;

  return <BenifitDetailsPanel benifitId={id} />;
}
