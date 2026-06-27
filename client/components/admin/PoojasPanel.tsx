"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_ENTITY_PAGE_SIZE_OPTIONS as pageSizeOptions, ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS } from "@/constants/admin-management.const";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/providers/ToastProvider";
import { APP_ROUTES } from "@/constants/route.const";
import type { BenifitTranslation } from "@/lib/api/admin/benifit/benifits.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import {
  deletePoojaApi,
  getAdminPoojasApi,
  type Pooja,
  type PoojaTranslation,
} from "@/lib/api/admin/pooja/poojas.api";
import { getErrorMessage } from "@/lib/utils";


function getPrimaryPoojaTranslation(translations: PoojaTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getPrimaryTempleTranslation(translations: TempleTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getPrimaryBenifitTranslation(translations: BenifitTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PoojasPanel() {
  const { showToast } = useToast();
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPoojas, setTotalPoojas] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Pooja | null>(null);
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

    async function loadPoojas() {
      setIsLoading(true);
      setError("");

      try {
        const poojasResponse = await getAdminPoojasApi({
          page,
          limit: pageSize,
          search: debouncedSearch,
        });

        if (!isActive) return;

        setPoojas(poojasResponse.items);
        setTotalPoojas(poojasResponse.meta.total);
        setTotalPages(Math.max(1, poojasResponse.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;

        setError(getErrorMessage(loadError, "Unable to load poojas."));
        setPoojas([]);
        setTotalPoojas(0);
        setTotalPages(1);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPoojas();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, page, pageSize, reloadKey]);

  const safePage = Math.min(page, totalPages);
  const visibleStart = totalPoojas === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min(
    (safePage - 1) * pageSize + poojas.length,
    totalPoojas,
  );
  const isSearchPending = search.trim().toLowerCase() !== debouncedSearch;

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function handleRefreshPoojas() {
    setReloadKey((current) => current + 1);
  }

  async function handleDeletePooja() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deletePoojaApi(deleteTarget.id);
      showToast("success", "Pooja deleted successfully.");
      setDeleteTarget(null);
      setReloadKey((current) => current + 1);
    } catch (deleteFailure: unknown) {
      const message = getErrorMessage(deleteFailure, "Unable to delete pooja.");

      setDeleteError(message);
      showToast("error", "Pooja delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
              Pooja Management
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
              Poojas
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
              Search and review pooja records, temple links, benifits, images,
              and translations.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleRefreshPoojas}
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
              <Link href={APP_ROUTES.adminPoojaCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pooja
              </Link>
            </Button>

            <label className="relative block min-w-0 sm:w-80">
              <span className="sr-only">Search poojas</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pooja, temple, or day"
                className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
              />
            </label>

            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary/70">
              Rows
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
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
              Showing {visibleStart}-{visibleEnd} of {totalPoojas}
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
                Loading poojas
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <p className="text-lg font-extrabold text-text-primary">
                Could not load poojas
              </p>
              <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
            </div>
          ) : poojas.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <Search className="h-8 w-8 text-text-primary/35" />
              <p className="text-lg font-extrabold text-text-primary">
                No poojas found
              </p>
              <p className="max-w-md text-sm leading-6 text-text-primary/60">
                Try a different pooja name, temple, day, or language.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                  <tr>
                    <th className="px-5 py-3">Pooja</th>
                    <th className="px-5 py-3">Temple</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Schedule</th>
                    <th className="px-5 py-3">Benifits</th>
                    <th className="px-5 py-3">Images</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {poojas.map((pooja) => {
                    const primary = getPrimaryPoojaTranslation(
                      pooja.translations,
                    );
                    const temple = getPrimaryTempleTranslation(
                      pooja.temple.translations,
                    );
                    const benifitNames = pooja.benefits
                      .map(
                        (benefit) =>
                          getPrimaryBenifitTranslation(benefit.translations)
                            ?.name,
                      )
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr key={pooja.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold leading-6 text-text-primary">
                            {primary?.name ?? "Untitled pooja"}
                          </p>
                          <p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">
                            {pooja.id}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold leading-6 text-text-primary/65">
                          {temple?.name ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-text-primary/65">
                          {formatAmount(pooja.baseAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-text-primary">
                            {pooja.poojaDay}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-text-primary/50">
                            {pooja.isWeekly ? "Weekly" : "Normal"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="line-clamp-2 max-w-xs text-sm font-semibold leading-6 text-text-primary/65">
                            {benifitNames || "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-saffron/10 px-3 py-1 text-xs font-extrabold text-saffron">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {pooja.imageKeys.length}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                          {formatDate(pooja.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={APP_ROUTES.adminPoojaDetails(pooja.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-text-primary/65 transition-colors hover:border-saffron hover:text-saffron"
                              aria-label={`View ${primary?.name ?? "pooja"}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(pooja);
                                setDeleteError("");
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
                              aria-label={`Delete ${primary?.name ?? "pooja"}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                <ChevronLeft className="h-4 w-4" />
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
                <ChevronRight className="h-4 w-4" />
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
            <DialogTitle>Delete Pooja</DialogTitle>
            <DialogDescription>
              This action permanently removes the pooja record.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-black/10 bg-[#f8fafc] p-4">
            <p className="text-sm font-bold text-text-primary">
              {deleteTarget
                ? getPrimaryPoojaTranslation(deleteTarget.translations)?.name ??
                  "Untitled pooja"
                : "Pooja"}
            </p>
            <p className="mt-1 break-all text-xs font-semibold text-text-primary/45">
              {deleteTarget?.id}
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
              onClick={handleDeletePooja}
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
