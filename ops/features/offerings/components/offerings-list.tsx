"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { deleteOffering, getOfferings } from "@/services/ops.service";
import type { Offering } from "@/types/ops";

const pageSize = 20;

export function OfferingsList() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search.trim());
  const params = {
    page,
    limit: pageSize,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status === "all" ? {} : { isActive: status === "active" })
  };
  const { data, isLoading } = useQuery({ queryKey: ["offerings", params], queryFn: () => getOfferings(params) });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOffering(id),
    onSuccess: async () => {
      setSelectedOffering(null);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["offerings"] });
      success("Offering deleted successfully.");
    },
    onError: (mutationError) => {
      setSelectedOffering(null);
      if (mutationError instanceof AxiosError && mutationError.response?.status === 409) {
        setError("This offering is associated with one or more poojas and cannot be deleted.");
        return;
      }
      const message = (mutationError as AxiosError<{ message?: string | string[] }>).response?.data?.message;
      setError(Array.isArray(message) ? message.join(" ") : message ?? "Unable to delete this offering.");
    }
  });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between"><CardTitle>Offerings</CardTitle><Button asChild><Link href="/offerings/new"><Plus className="h-4 w-4" />New Offering</Link></Button></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search offerings" className="pl-9" /></div>
          <select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} className="h-10 rounded-md border border-border bg-card px-3 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {error && <p className="mx-5 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Image</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Actual Price</th><th className="px-5 py-3">Discount Price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8" colSpan={6}>Loading offerings</td></tr>}
            {data?.items.map((offering) => <tr key={offering.id}><td className="px-5 py-3">{offering.imageUrl ? <div className="relative h-12 w-16 overflow-hidden rounded-md border border-border"><Image src={offering.imageUrl} alt={offering.name} fill unoptimized className="object-cover" /></div> : <div className="h-12 w-16 rounded-md bg-muted" />}</td><td className="px-5 py-4 font-semibold">{offering.name}</td><td className="px-5 py-4">{formatCurrency(offering.actualPrice)}</td><td className="px-5 py-4">{formatCurrency(offering.discountPrice)}</td><td className="px-5 py-4">{offering.isActive ? "ACTIVE" : "INACTIVE"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button asChild variant="outline" size="sm"><Link href={`/offerings/${offering.id}`}><Pencil className="h-4 w-4" />Edit</Link></Button><Button type="button" variant="destructive" size="sm" disabled={offering.poojaCount > 0} title={offering.poojaCount > 0 ? "This offering is used by one or more poojas" : undefined} onClick={() => setSelectedOffering(offering)}><Trash2 className="h-4 w-4" />Delete</Button></div></td></tr>)}
            {!isLoading && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={6}>No offerings found.</td></tr>}
          </tbody>
        </table>
        {data && data.meta.totalPages > 1 && <div className="flex items-center justify-between border-t border-border px-5 py-4"><p className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
      </CardContent>
      <ConfirmDialog open={Boolean(selectedOffering)} title="Delete offering?" description={`This will remove ${selectedOffering?.name ?? "this offering"}.`} confirmLabel="Delete" destructive pending={deleteMutation.isPending} onCancel={() => setSelectedOffering(null)} onConfirm={() => selectedOffering && deleteMutation.mutate(selectedOffering.id)} />
    </Card>
  );
}
