import type { MetadataRoute } from "next";

import { getLanguageAlternates, getPublicUrl } from "@/translations/metadata";
import { defaultLanguage } from "@/translations/locales";
import { getPoojasApi } from "@/lib/api/pooja/poojas.api";
import { getTemplesApi } from "@/lib/api/temple/temples.api";

function buildLocalizedSitemapItem(pathname: string): MetadataRoute.Sitemap[number] {
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

function buildEnglishSitemapItem(pathname: string): MetadataRoute.Sitemap[number] {
  return {
    url: getPublicUrl(pathname, defaultLanguage),
    lastModified: new Date(),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const localizedStaticPaths = ["/", "/poojas", "/temples"];
  const englishOnlyStaticPaths = [
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-cancellation-policy",
    "/service-partner-vendor-code-of-conduct",
  ];
  const sitemapItems: MetadataRoute.Sitemap = [
    ...localizedStaticPaths.map(buildLocalizedSitemapItem),
    ...englishOnlyStaticPaths.map(buildEnglishSitemapItem),
  ];

  try {
    const { items: poojas } = await getPoojasApi({ limit: 1000 });
    poojas.forEach((pooja) => {
      sitemapItems.push(buildLocalizedSitemapItem(`/poojas/${pooja.slug}`));
    });

    const { items: temples } = await getTemplesApi({ limit: 1000 });
    temples.forEach((temple) => {
      sitemapItems.push(buildLocalizedSitemapItem(`/temples/${temple.slug}`));
    });
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error);
  }

  return sitemapItems;
}