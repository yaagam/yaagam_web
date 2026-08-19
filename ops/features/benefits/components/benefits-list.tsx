"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteBenefit, getBenefits } from "@/services/ops.service";
import type { Benefit } from "@/types/ops";

const pageSize = 20;
function errorMessage(error: unknown) {
  const value = (error as AxiosError<{ message?: string | string[] }>).response?.data?.message;
  return Array.isArray(value) ? value.join(" ") : value;
}

export function BenefitsList() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Benefit | null>(null);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounce(search.trim());
  const params = { page, limit: pageSize, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
  const { data, isLoading, error: queryError, refetch, isFetching } = useQuery({ queryKey: ["benefits", params], queryFn: () => getBenefits(params) });
  const remove = useMutation({
    mutationFn: deleteBenefit,
    onSuccess: async () => { setSelected(null); setError(""); await queryClient.invalidateQueries({ queryKey: ["benefits"] }); success("Benefit deleted successfully."); },
    onError: (cause) => { setSelected(null); setError(cause instanceof AxiosError && cause.response?.status === 409 ? "This benefit is associated with one or more poojas and cannot be deleted." : errorMessage(cause) ?? "Unable to delete this benefit."); }
  });

  return <Card>
    <CardHeader className="space-y-4">
      <div className="flex items-center justify-between"><CardTitle>Benefits</CardTitle><Button asChild><Link href="/benefits/new"><Plus className="h-4 w-4" />New Benefit</Link></Button></div>
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search benefits" className="pl-9" /></div>
    </CardHeader>
    <CardContent className="overflow-x-auto p-0">
      {queryError && <div className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive"><span>{errorMessage(queryError) ?? "Unable to load benefits from the server."}</span><button type="button" onClick={() => void refetch()} className="rounded border border-red-300 px-3 py-1" disabled={isFetching}>Retry</button></div>}
      {error && <p className="mx-5 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Translations</th><th className="px-5 py-3">Poojas</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-border">
          {isLoading && <tr><td className="px-5 py-8" colSpan={4}>Loading benefits</td></tr>}
          {data?.items.map((benefit) => <tr key={benefit.id}><td className="px-5 py-4 font-semibold">{benefit.name}</td><td className="px-5 py-4">{benefit.translations.length}/5</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{benefit.poojas.length > 0 ? benefit.poojas.map((pooja) => <Link key={pooja.id} href={`/poojas/${pooja.id}`} className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium hover:text-primary">{pooja.name}</Link>) : <span className="text-muted-foreground">None ({benefit.poojaCount})</span>}</div></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button asChild variant="outline" size="sm"><Link href={`/benefits/${benefit.id}`}><Pencil className="h-4 w-4" />Edit</Link></Button><Button type="button" variant="destructive" size="sm" disabled={benefit.poojaCount > 0} onClick={() => setSelected(benefit)}><Trash2 className="h-4 w-4" />Delete</Button></div></td></tr>)}
          {!isLoading && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={4}>No benefits found.</td></tr>}
        </tbody>
      </table>
      {data && data.meta.totalPages > 1 && <div className="flex items-center justify-between border-t border-border px-5 py-4"><p className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
    </CardContent>
    <ConfirmDialog open={Boolean(selected)} title="Delete benefit?" description={`This will remove ${selected?.name ?? "this benefit"}.`} confirmLabel="Delete" destructive pending={remove.isPending} onCancel={() => setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} />
  </Card>;
}
