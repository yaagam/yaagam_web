import { BlogDetailsView } from "@/components/blocks/BlogDetailsView";

export default async function BlogPreviewPage({
  params,
}: PageProps<"/[lang]/admin/blogs/[id]/preview">) {
  const { id } = await params;

  return <BlogDetailsView blogIdOrSlug={id} isPreview />;
}
