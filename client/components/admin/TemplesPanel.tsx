"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

import {
  getAdminTemplesApi,
  type Temple,
  type TempleTranslation,
} from "@/lib/api/admin/temples.api";
import { getErrorMessage } from "@/lib/utils";

const pageSizeOptions = [5, 10, 20];
const SEARCH_DEBOUNCE_MS = 350;

function getPrimaryTranslation(translations: TempleTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getTempleSearchText(temple: Temple) {
  return temple.translations
    .map((translation) =>
      [translation.name, translation.place, translation.district, translation.language]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ")
    .toLowerCase();
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

export function TemplesPanel() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadTemples() {
      setIsLoading(true);
      setError("");

      try {
        const nextTemples = await getAdminTemplesApi();

        if (!isActive) return;

        setTemples(nextTemples);
      } catch (loadError: unknown) {
        if (!isActive) return;

        setError(getErrorMessage(loadError, "Unable to load temples."));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadTemples();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredTemples = useMemo(() => {
    if (!debouncedSearch) return temples;

    return temples.filter((temple) =>
      getTempleSearchText(temple).includes(debouncedSearch),
    );
  }, [debouncedSearch, temples]);

  const totalPages = Math.max(1, Math.ceil(filteredTemples.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTemples = filteredTemples.slice(startIndex, startIndex + pageSize);
  const visibleStart = filteredTemples.length === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + pageSize, filteredTemples.length);
  const isSearchPending = search.trim().toLowerCase() !== debouncedSearch;

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Temple Management
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            Temples
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
            Search and review temple records, locations, image keys, and
            translation coverage.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 sm:w-80">
            <span className="sr-only">Search temples</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search temple, place, district"
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
            Showing {visibleStart}-{visibleEnd} of {filteredTemples.length}
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
              Loading temples
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-lg font-extrabold text-text-primary">
              Could not load temples
            </p>
            <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
          </div>
        ) : paginatedTemples.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <Search className="h-8 w-8 text-text-primary/35" />
            <p className="text-lg font-extrabold text-text-primary">
              No temples found
            </p>
            <p className="max-w-md text-sm leading-6 text-text-primary/60">
              Try a different temple name, place, district, or language.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                <tr>
                  <th className="px-5 py-3">Temple</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Translations</th>
                  <th className="px-5 py-3">Image key</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {paginatedTemples.map((temple) => {
                  const primary = getPrimaryTranslation(temple.translations);
                  const languages = temple.translations
                    .map((translation) => translation.language)
                    .join(", ");

                  return (
                    <tr key={temple.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="text-sm font-extrabold leading-6 text-text-primary">
                          {primary?.name ?? "Untitled temple"}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">
                          {temple.id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-6 text-text-primary">
                              {primary?.place ?? "-"}
                            </p>
                            <p className="text-xs font-semibold text-text-primary/55">
                              {primary?.district ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex min-h-8 items-center rounded-full bg-saffron/10 px-3 py-1 text-xs font-extrabold text-saffron">
                          {languages || "None"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-xs items-start gap-2 text-sm font-semibold leading-6 text-text-primary/65">
                          <ImageIcon className="mt-1 h-4 w-4 shrink-0 text-text-primary/35" />
                          <span className="min-w-0 break-all">
                            {temple.imageKey || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                        {formatDate(temple.createdAt)}
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
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
