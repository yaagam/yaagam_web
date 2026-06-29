import type { Metadata } from "next";

import { PoojaDetailsView } from "@/components/blocks/PoojaDetailsView";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";

export async function generateMetadata({
  params,
}: PageProps<"/poojas/[id]">): Promise<Metadata> {
  const { id } = await params;

  try {
    const pooja = await getPoojaDetailsApi(id);
    const translation =
      pooja.translations.find((item) => item.language === "EN") ??
      pooja.translations[0];
    const title = translation?.name ?? "Pooja";
    const description =
      translation?.about ?? "Book authentic temple pooja with Yaagam.";

    return {
      title: `${title} | Yaagam`,
      description,
      openGraph: {
        title,
        description,
        images: pooja.imageUrls?.slice(0, 1),
      },
    };
  } catch {
    return {
      title: "Pooja | Yaagam",
      description: "Book authentic temple pooja with Yaagam.",
    };
  }
}

export default async function PoojaDetailsPage({
  params,
}: PageProps<"/poojas/[id]">) {
  const { id } = await params;

  return <PoojaDetailsView poojaId={id} />;
}