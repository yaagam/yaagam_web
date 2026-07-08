import { BlogDetailsPanel } from "@/components/admin/blog/BlogDetailsPanel";

export default async function BlogDetailsPage({
  params,
}: PageProps<"/[lang]/admin/blogs/[id]">) {
  const { id } = await params;

  return <BlogDetailsPanel blogId={id} />;
}
