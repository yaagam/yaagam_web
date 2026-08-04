import type { Metadata } from "next";
import { getSeoAlternates } from "@/translations/metadata";
import HomeClient from "./HomeClient";
import { isLanguage, defaultLanguage, type Language } from "@/translations/locales";
import { getPoojasApi, type Pooja } from "@/lib/api/pooja/poojas.api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const language: Language = isLanguage(lang) ? lang : defaultLanguage;

  return {
    alternates: getSeoAlternates("/", language),
  };
}

export default async function Page() {
  let initialPoojas: Pooja[] = [];

  try {
    const response = await getPoojasApi({ page: 1, limit: 100 });
    initialPoojas = response.items;
  } catch (error) {
    console.error("Failed to load initial poojas for Home page", error);
  }

  return <HomeClient initialPoojas={initialPoojas} />;
}
