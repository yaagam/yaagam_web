"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { BlogForm } from "@/components/admin/blog/BlogForm";
import {
  getBlogDetailsApi,
  type Blog,
} from "@/lib/api/admin/blog/blogs.api";
import { getErrorMessage } from "@/lib/utils";

type BlogDetailsPanelProps = {
  blogId: string;
};

export function BlogDetailsPanel({ blogId }: BlogDetailsPanelProps) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadBlog() {
      setIsLoading(true);
      setError("");

      try {
        const nextBlog = await getBlogDetailsApi(blogId);
        if (isActive) setBlog(nextBlog);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load blog."));
          setBlog(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadBlog();

    return () => {
      isActive = false;
    };
  }, [blogId]);

  if (isLoading) {
    return (
      <div className="flex min-h-120 items-center justify-center gap-3 text-text-primary/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">Loading blog</span>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:px-8">
        <h2 className="text-2xl font-extrabold text-text-primary">
          Could not load blog
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Blog not found."}
        </p>
      </section>
    );
  }

  return <BlogForm mode="update" blog={blog} />;
}
