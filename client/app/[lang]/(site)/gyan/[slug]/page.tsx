import { BlogDetailsView } from "@/components/blocks/BlogDetailsView";

export default async function GyanArticlePage({
  params,
}: PageProps<"/[lang]/gyan/[slug]">) {
  const { lang, slug } = await params;

  return <BlogDetailsView blogIdOrSlug={slug} language={lang} />;
}