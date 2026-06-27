"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_LARGE_PAGE_SIZE_OPTIONS as pageSizeOptions, ADMIN_SEARCH_DEBOUNCE_MS as SEARCH_DEBOUNCE_MS } from "@/constants/admin-management.const";
import { getAdminUsersApi, type AdminUserItem, type AdminUserRole, type AuthProvider } from "@/lib/api/admin/management/admin-management.api";
import { getErrorMessage } from "@/lib/utils";


function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function roleLabel(role: AdminUserRole) {
  return role.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function UsersManagementPanel() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<AdminUserRole | "">("");
  const [provider, setProvider] = useState<AuthProvider | "">("");
  const [verified, setVerified] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getAdminUsersApi({
          page,
          limit: pageSize,
          search: debouncedSearch,
          role,
          provider,
          isWhatsappVerified: verified === "" ? "" : verified === "true",
        });

        if (!isActive) return;

        setUsers(response.items);
        setTotalUsers(response.meta.total);
        setTotalPages(Math.max(1, response.meta.totalPages));
      } catch (loadError: unknown) {
        if (!isActive) return;

        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
        setError(getErrorMessage(loadError, "Unable to load users."));
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch, page, pageSize, provider, reloadKey, role, verified]);

  const safePage = Math.min(page, totalPages);
  const visibleStart = totalUsers === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min((safePage - 1) * pageSize + users.length, totalUsers);
  const isSearchPending = search.trim() !== debouncedSearch;

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setRole("");
    setProvider("");
    setVerified("");
    setPage(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">User Management</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">Users</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-primary/65">
            Search users and filter by role, auth provider, and WhatsApp verification.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <label className="relative block min-w-0 lg:w-72">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user ID or WhatsApp"
              className="h-11 w-full rounded-lg border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-text-primary outline-none transition-colors placeholder:text-text-primary/35 focus:border-saffron"
            />
          </label>

          <select value={role} onChange={(event) => { setRole(event.target.value as AdminUserRole | ""); setPage(1); }} className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron">
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>

          <select value={provider} onChange={(event) => { setProvider(event.target.value as AuthProvider | ""); setPage(1); }} className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron">
            <option value="">All providers</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="GOOGLE">Google</option>
            <option value="FACEBOOK">Facebook</option>
          </select>

          <select value={verified} onChange={(event) => { setVerified(event.target.value as "" | "true" | "false"); setPage(1); }} className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron">
            <option value="">All verification</option>
            <option value="true">WhatsApp verified</option>
            <option value="false">Not verified</option>
          </select>

          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-text-primary outline-none focus:border-saffron">
            {pageSizeOptions.map((option) => <option key={option} value={option}>{option} rows</option>)}
          </select>

          <Button type="button" variant="outline" disabled={isLoading} onClick={() => setReloadKey((current) => current + 1)} className="min-h-11 rounded-lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-text-primary/65">Showing {visibleStart}-{visibleEnd} of {totalUsers}</p>
          <div className="flex items-center gap-3">
            {isSearchPending && <span className="inline-flex items-center gap-2 text-xs font-extrabold text-saffron"><Loader2 className="h-3.5 w-3.5 animate-spin" />Searching</span>}
            <button type="button" onClick={resetFilters} className="text-xs font-extrabold text-saffron hover:text-[#c96c1a]">Reset filters</button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><Loader2 className="h-8 w-8 animate-spin text-saffron" /><p className="text-sm font-bold text-text-primary/65">Loading users</p></div>
        ) : error ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><p className="text-lg font-extrabold text-text-primary">Could not load users</p><p className="max-w-md text-sm leading-6 text-red-600">{error}</p></div>
        ) : users.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-10 text-center"><Users className="h-8 w-8 text-text-primary/35" /><p className="text-lg font-extrabold text-text-primary">No users found</p><p className="max-w-md text-sm leading-6 text-text-primary/60">Try changing search or filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase tracking-[0.08em] text-text-primary/55">
                <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Usage</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Updated</th></tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {users.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-text-primary">{user.whatsappNumber ? `+91 ${user.whatsappNumber}` : "No WhatsApp"}</p>
                      <p className="mt-1 max-w-xs truncate text-xs font-semibold text-text-primary/45">{user.id}</p>
                      <p className={`mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${user.isWhatsappVerified ? "bg-[#e7f8ee] text-[#1f9b52]" : "bg-[#f3f4f6] text-[#667085]"}`}><ShieldCheck className="h-3.5 w-3.5" />{user.isWhatsappVerified ? "Verified" : "Not verified"}</p>
                    </td>
                    <td className="px-5 py-4"><span className="inline-flex min-h-8 items-center rounded-full bg-saffron/10 px-3 py-1 text-xs font-extrabold text-saffron">{roleLabel(user.role)}</span></td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/65">{user.provider ?? "-"}</td>
                    <td className="px-5 py-4 text-sm font-bold leading-6 text-text-primary/65">{user.bookingsCount} bookings<br />{user.devoteesCount} devotees<br />{user.addressesCount} addresses</td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/60">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-text-primary/60">{formatDate(user.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-text-primary/60">Page {safePage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45"><ChevronLeft className="h-4 w-4" />Previous</button>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron disabled:cursor-not-allowed disabled:opacity-45">Next<ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}