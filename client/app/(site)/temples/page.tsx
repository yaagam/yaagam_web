import type { Metadata } from "next";

import { TemplesListContent } from "@/components/blocks/TemplesListContent";
import { getAdminTemplesApi } from "@/lib/api/admin/temple/temples.api";
import { getErrorMessage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Temples of Bharat | Yaagam",
  description: "Explore available temples and learn their significance on Yaagam.",
};

export default async function TemplesPage() {
  try {
    const templesResponse = await getAdminTemplesApi({ limit: 100 });

    return <TemplesListContent temples={templesResponse.items} />;
  } catch (error: unknown) {
    return (
      <TemplesListContent
        temples={[]}
        initialError={getErrorMessage(error, "Unable to load temples.")}
      />
    );
  }
}