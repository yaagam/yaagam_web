"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";
import { getUsers } from "@/services/ops.service";

const pageSize = 20;

function errorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  return Array.isArray(message) ? message.join(" ") : message;
}

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim());
  const params = { page, limit: pageSize, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
  });
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Users</CardTitle>
        <label className="relative block sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search phone number or user ID" className="pl-9" />
        </label>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {error && <div className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive"><span>{errorMessage(error) ?? "Unable to load users."}</span><Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>Retry</Button></div>}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">WhatsApp</th><th className="px-5 py-3">Verified</th><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Bookings</th><th className="px-5 py-3">Addresses</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">User ID</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={7} className="px-5 py-8 text-muted-foreground">Loading users</td></tr>}
            {data?.items.map((user) => <tr key={user.id}><td className="px-5 py-4 font-semibold">{user.whatsappNumber ?? "-"}</td><td className="px-5 py-4">{user.isWhatsappVerified ? "Yes" : "No"}</td><td className="px-5 py-4">{user.provider ?? "-"}</td><td className="px-5 py-4">{user.bookingsCount}</td><td className="px-5 py-4">{user.addressesCount}</td><td className="px-5 py-4">{formatDate(user.createdAt)}</td><td className="max-w-56 truncate px-5 py-4 font-mono text-xs" title={user.id}>{user.id}</td></tr>)}
            {!isLoading && data?.items.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-muted-foreground">No users found.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm"><span className="text-muted-foreground">Page {page} of {totalPages}{isFetching && !isLoading ? " - Refreshing" : ""}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
      </CardContent>
    </Card>
  );
}
