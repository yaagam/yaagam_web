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



function mergeBenifitImageUrls(
  pooja: Pooja,
  imageUrlsById: Map<string, string | null>,
): Pooja {
  return {
    ...pooja,
    benefits: pooja.benefits.map((benifit) => ({
      ...benifit,
      imageUrl: benifit.imageUrl ?? imageUrlsById.get(benifit.slug) ?? null,
    })),
  };
}

export async function PoojaDetailsView({ poojaId }: PoojaDetailsViewProps) {
  const copy = detailCopy.en;
  let pooja: Pooja | null = null;
  let error = "";

  try {
    const [nextPooja, benifitsResponse] = await Promise.all([
      getPoojaDetailsApi(poojaId),
      getBenifitsApi({ page: 1, limit: 100 }),
    ]);

    const imageUrlsById = new Map<string, string | null>();
    for (const benifit of benifitsResponse.items) {
      imageUrlsById.set(benifit.slug, benifit.imageUrl ?? null);
    }

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
