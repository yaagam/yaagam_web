import { LocalizedLink as Link } from "@/components/ui/localized-link";

import { PoojaDetailsContent } from "@/components/blocks/PoojaDetailsContent";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";
import {
  getBenifitsApi,
} from "@/lib/api/benifit/benifits.api";
import type { Pooja } from "@/lib/api/pooja/poojas.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import { detailCopy } from "@/translations/pooja-detail-copy";
import { getErrorMessage } from "@/lib/utils";

type PoojaDetailsViewProps = {
  poojaId: string;
};

async function getBenifitImageUrlsById(benifitIds: string[]) {
  const remainingIds = new Set(benifitIds);
  const imageUrlsById = new Map<string, string | null>();
  let page = 1;

  while (remainingIds.size > 0) {
    const response = await getBenifitsApi({ page, limit: 100 });

    for (const benifit of response.items) {
      if (!remainingIds.has(benifit.id)) continue;

      imageUrlsById.set(benifit.id, benifit.imageUrl ?? null);
      remainingIds.delete(benifit.id);
    }

    if (!response.meta.hasNextPage || response.items.length === 0) break;
    page += 1;
  }

  return imageUrlsById;
}

function mergeBenifitImageUrls(
  pooja: Pooja,
  imageUrlsById: Map<string, string | null>,
): Pooja {
  return {
    ...pooja,
    benefits: pooja.benefits.map((benifit) => ({
      ...benifit,
      imageUrl: benifit.imageUrl ?? imageUrlsById.get(benifit.id) ?? null,
    })),
  };
}

export async function PoojaDetailsView({ poojaId }: PoojaDetailsViewProps) {
  const copy = detailCopy.en;
  let pooja: Pooja | null = null;
  let error = "";

  try {
    const nextPooja = await getPoojaDetailsApi(poojaId);
    const imageUrlsById = await getBenifitImageUrlsById(
      nextPooja.benefits.map((benifit) => benifit.id),
    );
    pooja = mergeBenifitImageUrls(nextPooja, imageUrlsById);
  } catch (loadError: unknown) {
    error = getErrorMessage(loadError, copy.loadErrorTitle);
  }

  if (!pooja) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-text-primary">
          {copy.loadErrorTitle}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || copy.notFound}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.poojas}>{copy.viewAllPoojas}</Link>
        </Button>
      </section>
    );
  }

  return <PoojaDetailsContent poojaId={poojaId} pooja={pooja} />;
}
