import type { Metadata } from "next";

import { TempleDetailsContent } from "@/components/blocks/TempleDetailsContent";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getTempleDetailsApi } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

type TempleDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TempleDetailsPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const temple = await getTempleDetailsApi(id);
    const translation =
      temple.translations.find((item) => item.language === "EN") ??
      temple.translations[0];
    const title = translation?.name ?? "Temple";
    const description =
      translation?.description ?? "Learn more about this temple on Yaagam.";

    return {
      title: `${title} | Yaagam`,
      description,
      openGraph: {
        title,
        description,
        images: temple.imageUrl ? [temple.imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Temple | Yaagam",
      description: "Learn more about temples on Yaagam.",
    };
  }
}

export default async function TempleDetailsPage({
  params,
}: TempleDetailsPageProps) {
  const { id } = await params;
  const loadResult = await loadTemplePageData(id);

  if (!loadResult.ok) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-text-primary">
          Could not load temple
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {loadResult.error}
        </p>
      </section>
    );
  }

  return (
    <TempleDetailsContent
      temple={loadResult.temple}
      poojas={loadResult.poojas}
    />
  );
}

async function loadTemplePageData(id: string) {
  try {
    const [temple, poojaResponse] = await Promise.all([
      getTempleDetailsApi(id),
      getPoojasApi({ page: 1, limit: 12, templeId: id }),
    ]);

    return {
      ok: true as const,
      temple,
      poojas: poojaResponse.items,
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      error: getErrorMessage(
        error,
        "Temple details failed. Please try again.",
      ),
    };
  }
}