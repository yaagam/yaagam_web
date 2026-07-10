"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ADMIN_ENTITY_PAGE_SIZE_OPTIONS as pageSizeOptions,
  ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS,
} from "@/constants/admin-management.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/providers/ToastProvider";
import {
  deleteBlogApi,
  getAdminBlogsApi,
  type Blog,
  type BlogSortKey,
  type BlogSortOrder,
  type BlogStatus,
} from "@/lib/api/admin/blog/blogs.api";
import { getErrorMessage } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClassName(status: BlogStatus) {
  if (status === "published") return "bg-emerald-50 text-emerald-700";
  return "bg-saffron/10 text-saffron";
}

export function BlogsPanel() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<BlogStatus | "">("");
  const [sortBy, setSortBy] = useState<BlogSortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<BlogSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadBlogs() {
      setIsLoading(true);
      setError("");

      try {
        const blogsResponse = await getAdminBlogsApi({
          page,
          limit: pageSize,
          search: debouncedSearch,
          status,
          sortBy,
          sortOrder,
        });

        if (!isActive) return;
        setBlogs(blogsResponse.items);
        setTotalBlogs(blogsResponse.meta.total);
        setTotalPages(Math.max(1, blogsResponse.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;
        setError(getErrorMessage(loadError, "Unable to load blogs."));
        setBlogs([]);
        setTotalBlogs(0);
        setTotalPages(1);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadBlogs();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, page, pageSize, reloadKey, sortBy, sortOrder, status]);

  const safePage = Math.min(page, totalPages);
  const visibleStart = totalBlogs === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min(
    (safePage - 1) * pageSize + blogs.length,
    totalBlogs,
  );
  const isSearchPending = search.trim().toLowerCase() !== debouncedSearch;

  async function handleDeleteBlog() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteBlogApi(deleteTarget.id);
      showToast("success", "Blog deleted successfully.");
      setDeleteTarget(null);
      setReloadKey((current) => current + 1);
    } catch (deleteFailure: unknown) {
      setDeleteError(getErrorMessage(deleteFailure, "Unable to delete blog."));
      showToast("error", "Blog delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
              Blog Management
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
              Blogs
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
              Manage published articles, drafts, relations, SEO metadata, and
              block-based content.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setReloadKey((current) => current + 1)}
              className="min-h-11 rounded-lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button asChild className="min-h-11 rounded-lg">
              <Link href={APP_ROUTES.adminBlogCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Blog
              </Link>
            </Button>
            <label className="relative block min-w-0 sm:w-72">
              <span className="sr-only">Search blogs</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, slug, author"
                className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as BlogStatus | "");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-extrabold text-text-primary outline-none focus:border-saffron"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortBy, nextSortOrder] = event.target.value.split(
                  ":",
                ) as [BlogSortKey, BlogSortOrder];
                setSortBy(nextSortBy);
                setSortOrder(nextSortOrder);
              }}
              className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-extrabold text-text-primary outline-none focus:border-saffron"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="publishedAt:desc">Recently published</option>
              <option value="title:asc">Title A-Z</option>
              <option value="status:asc">Status</option>
            </select>
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70">
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="bg-transparent text-sm font-extrabold text-text-primary outline-none"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
          <div className="flex min-h-14 items-center justify-between gap-4 border-b border-black/10 px-4 py-3">
            <p className="text-sm font-bold text-text-primary/65">
              Showing {visibleStart}-{visibleEnd} of {totalBlogs}
            </p>
            {isSearchPending && (
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-saffron" />
              <p className="text-sm font-bold text-text-primary/65">
                Loading blogs
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <p className="text-lg font-extrabold text-text-primary">
                Could not load blogs
              </p>
              <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <Search className="h-8 w-8 text-text-primary/35" />
              <p className="text-lg font-extrabold text-text-primary">
                No blogs found
              </p>
              <p className="max-w-md text-sm leading-6 text-text-primary/60">
                Try a different search, status, or sort option.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                  <tr>
                    <th className="px-5 py-3">Blog</th>
                    <th className="px-5 py-3">Slug</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Published</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {blogs.map((blog) => (
                    <tr key={blog.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="grid min-w-72 grid-cols-[4.5rem_1fr] gap-4">
                          <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-[#f8fafc]">
                            {blog.featuredImageUrl ? (
                              <Image
                                src={blog.featuredImageUrl}
                                alt={blog.title}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-text-primary/35">
                                <ImageIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-extrabold leading-6 text-text-primary">
                              {blog.title || "Untitled blog"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-text-primary/45">
                              {blog.author}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/65">
                        {blog.slug}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize ${statusClassName(
                            blog.status,
                          )}`}
                        >
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                        {formatDate(blog.publishedAt)}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                        {formatDate(blog.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={APP_ROUTES.adminBlogPreview(blog.slug || blog.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-text-primary/65 transition-colors hover:border-saffron hover:text-saffron"
                            aria-label={`View ${blog.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={APP_ROUTES.adminBlogDetails(blog.slug || blog.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-text-primary/65 transition-colors hover:border-saffron hover:text-saffron"
                            aria-label={`Edit ${blog.title}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(blog);
                              setDeleteError("");
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
                            aria-label={`Delete ${blog.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-text-primary/60">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="motion-arrow-left h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
                <ChevronRight className="motion-arrow-right h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Blog</DialogTitle>
            <DialogDescription>
              This action permanently removes the blog record.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-black/10 bg-[#f8fafc] p-4">
            <p className="text-sm font-bold text-text-primary">
              {deleteTarget?.title ?? "Blog"}
            </p>
            <p className="mt-1 break-all text-xs font-semibold text-text-primary/45">
              {deleteTarget?.slug}
            </p>
          </div>

          {deleteError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
              {deleteError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError("");
              }}
              className="min-h-11 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteBlog}
              className="min-h-11 rounded-lg bg-red-500 hover:bg-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
