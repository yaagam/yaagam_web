"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ADMIN_LARGE_PAGE_SIZE_OPTIONS as pageSizeOptions,
  ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS,
} from "@/constants/admin-management.const";
import {
  getAdminSupportTicketsApi,
  updateAdminSupportTicketStatusApi,
  type AdminSupportStatus,
  type AdminSupportTicketItem,
} from "@/lib/api/admin/management/admin-management.api";
import { getErrorMessage } from "@/lib/utils";

const supportStatuses: AdminSupportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

function label(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: AdminSupportStatus) {
  if (status === "RESOLVED") return "bg-[#e7f8ee] text-[#1f9b52]";
  if (status === "IN_PROGRESS") return "bg-[#fff1dc] text-[#e67e22]";

  return "bg-[#e9f1ff] text-[#2463d5]";
}

function getOpenTicketCount(tickets: AdminSupportTicketItem[]) {
  return tickets.filter((ticket) => ticket.status !== "RESOLVED").length;
}

export function SupportTicketsManagementPanel() {
  const [tickets, setTickets] = useState<AdminSupportTicketItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<AdminSupportStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [resolvingTicketId, setResolvingTicketId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function loadTickets() {
      setIsLoading(true);
      setError("");
      setActionError("");

      try {
        const response = await getAdminSupportTicketsApi({
          page,
          limit: pageSize,
          search: debouncedSearch,
          status,
        });

        if (!isActive) return;

        setTickets(response.items);
        setTotalTickets(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;

        setTickets([]);
        setTotalTickets(0);
        setTotalPages(1);
        setError(getErrorMessage(loadError, "Unable to load support tickets."));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadTickets();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, page, pageSize, reloadKey, status]);

  const safePage = Math.min(page, totalPages);
  const visibleStart = totalTickets === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min(
    (safePage - 1) * pageSize + tickets.length,
    totalTickets,
  );
  const isSearchPending = search.trim() !== debouncedSearch;
  const openTicketCount = getOpenTicketCount(tickets);

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPage(1);
  }

  async function resolveTicket(ticket: AdminSupportTicketItem) {
    setResolvingTicketId(ticket.id);
    setActionError("");

    try {
      const updatedTicket = await updateAdminSupportTicketStatusApi(ticket.id, {
        status: "RESOLVED",
      });

      const shouldRemoveFromCurrentView = Boolean(
        status && updatedTicket.status !== status,
      );

      if (shouldRemoveFromCurrentView) {
        setTotalTickets((currentTotal) => Math.max(0, currentTotal - 1));
      }

      setTickets((currentTickets) =>
        currentTickets
          .map((currentTicket) =>
            currentTicket.id === ticket.id
              ? {
                  ...currentTicket,
                  status: updatedTicket.status,
                  resolvedAt: updatedTicket.resolvedAt,
                  resolvedBy: updatedTicket.resolvedBy,
                }
              : currentTicket,
          )
          .filter(
            (currentTicket) =>
              !shouldRemoveFromCurrentView || currentTicket.id !== ticket.id,
          ),
      );
    } catch (resolveError: unknown) {
      setActionError(
        getErrorMessage(resolveError, "Unable to resolve support ticket."),
      );
    } finally {
      setResolvingTicketId("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Ticket Management
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            Support Tickets
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
            Review customer support requests, track status, and resolve completed tickets.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <label className="relative block min-w-0 lg:w-80">
            <span className="sr-only">Search support tickets</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, name, mobile"
              className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminSupportStatus | "");
              setPage(1);
            }}
            className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron"
          >
            <option value="">All statuses</option>
            {supportStatuses.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </select>

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
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-primary/45">
            Total
          </p>
          <p className="mt-1 text-2xl font-extrabold text-text-primary">
            {totalTickets}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-primary/45">
            Open On Page
          </p>
          <p className="mt-1 text-2xl font-extrabold text-saffron">
            {openTicketCount}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-primary/45">
            View
          </p>
          <p className="mt-1 text-2xl font-extrabold text-text-primary">
            {status ? label(status) : "All"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-text-primary/65">
            Showing {visibleStart}-{visibleEnd} of {totalTickets}
          </p>
          <div className="flex items-center gap-3">
            {isSearchPending && (
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-extrabold text-saffron hover:text-[#c96c1a]"
            >
              Reset filters
            </button>
          </div>
        </div>

        {actionError && (
          <div className="border-b border-red-200 bg-[#fff0ee] px-4 py-3 text-sm font-bold text-red-700">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-saffron" />
            <p className="text-sm font-bold text-text-primary/65">
              Loading support tickets
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-lg font-extrabold text-text-primary">
              Could not load support tickets
            </p>
            <p className="max-w-md text-sm leading-6 text-red-600">{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <MessageSquareText className="h-8 w-8 text-text-primary/35" />
            <p className="text-lg font-extrabold text-text-primary">
              No support tickets found
            </p>
            <p className="max-w-md text-sm leading-6 text-text-primary/60">
              Try changing search or status filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Problem</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {tickets.map((ticket) => {
                  const isResolving = resolvingTicketId === ticket.id;
                  const isResolved = ticket.status === "RESOLVED";

                  return (
                    <tr key={ticket.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="text-sm font-extrabold text-text-primary">
                          {ticket.ticketNumber}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">
                          {ticket.id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-extrabold text-text-primary">
                          {ticket.name}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-text-primary/55">
                          <Phone className="h-3.5 w-3.5 text-saffron" />
                          +91 {ticket.phoneNumber}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-text-primary/45">
                          Prefers {label(ticket.contactMethod)}
                        </p>
                      </td>
                      <td className="max-w-md px-5 py-4">
                        <p className="text-sm font-semibold leading-6 text-text-primary/70 text-wrap-safe">
                          {ticket.problem}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(ticket.status)}`}
                        >
                          {label(ticket.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-text-primary/60">
                        {formatDateTime(ticket.resolvedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isResolved ? (
                          <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#e7f8ee] px-3 py-2 text-sm font-extrabold text-[#1f9b52]">
                            <CheckCircle2 className="h-4 w-4" />
                            Resolved
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isResolving}
                            onClick={() => void resolveTicket(ticket)}
                            className="min-h-10 rounded-lg"
                          >
                            {isResolving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Resolve
                          </Button>
                        )}
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

