import type { MetadataRoute } from "next";

import { getLanguageAlternates, getPublicUrl } from "@/translations/metadata";
import { defaultLanguage } from "@/translations/locales";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getTemplesApi } from "@/lib/api/temple/temples.api";

function buildSitemapItem(pathname: string): MetadataRoute.Sitemap[number] {
  return {
    url: getPublicUrl(pathname, defaultLanguage),
    lastModified: new Date(),
    alternates: {
      languages: {
        "x-default": getPublicUrl(pathname, defaultLanguage),
        ...getLanguageAlternates(pathname),
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/poojas",
    "/temples",
    "/blogs",
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-cancellation-policy",
    "/service-partner-vendor-code-of-conduct",
  ];

  const sitemapItems: MetadataRoute.Sitemap = staticPaths.map(buildSitemapItem);

  try {
    const { items: poojas } = await getPoojasApi({ limit: 1000 });
    poojas.forEach((pooja) => {
      sitemapItems.push(buildSitemapItem(`/poojas/${pooja.slug}`));
    });

    const { items: temples } = await getTemplesApi({ limit: 1000 });
    temples.forEach((temple) => {
      sitemapItems.push(buildSitemapItem(`/temples/${temple.slug}`));
    });
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error);
  }

  return sitemapItems;
}
