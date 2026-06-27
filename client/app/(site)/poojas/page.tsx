import { PoojasBrowser } from "@/components/blocks/PoojasBrowser";
import { POOJAS_PAGE_SIZE } from "@/constants/poojas-browser.const";
import type { Benifit } from "@/lib/api/admin/benifit/benifits.api";
import { getAdminBenifitsApi } from "@/lib/api/admin/benifit/benifits.api";
import type { Pooja, PoojasMeta } from "@/lib/api/admin/pooja/poojas.api";
import type { Temple } from "@/lib/api/admin/temple/temples.api";
import { getAdminTemplesApi } from "@/lib/api/admin/temple/temples.api";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getErrorMessage } from "@/lib/utils";


type PoojasPageData = {
  initialPoojas?: Pooja[];
  initialMeta?: PoojasMeta;
  initialTemples?: Temple[];
  initialBenifits?: Benifit[];
  initialError?: string;
};

async function getPoojasPageData(): Promise<PoojasPageData> {
  try {
    const [poojaResponse, templeResponse, benifitResponse] = await Promise.all([
      getPoojasApi({ page: 1, limit: POOJAS_PAGE_SIZE }),
      getAdminTemplesApi({ limit: 100 }),
      getAdminBenifitsApi({ limit: 100 }),
    ]);

    return {
      initialPoojas: poojaResponse.items,
      initialMeta: poojaResponse.meta,
      initialTemples: templeResponse.items,
      initialBenifits: benifitResponse.items,
    };
  } catch (error: unknown) {
    return {
      initialError: getErrorMessage(error, "Unable to load poojas."),
    };
  }
}

export default async function PoojasPage() {
  const pageData = await getPoojasPageData();

  return <PoojasBrowser {...pageData} />;
}
