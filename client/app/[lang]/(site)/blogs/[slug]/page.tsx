import { BlogDetailsView } from "@/components/blocks/BlogDetailsView";

export default async function BlogPage({
  params,
}: PageProps<"/[lang]/blogs/[slug]">) {
  const { lang, slug } = await params;

  return <BlogDetailsView blogIdOrSlug={slug} language={lang} />;
}