"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { deletePooja, getPoojas } from "@/services/ops.service";
import { formatCurrency } from "@/lib/utils";
import type { Pooja } from "@/types/ops";

export function PoojasList() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [selectedPooja, setSelectedPooja] = useState<Pooja | null>(null);
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["poojas"], queryFn: () => getPoojas({ page: 1, limit: 20 }) });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePooja(id),
    onSuccess: async () => {
      setSelectedPooja(null);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["poojas"] });
      success("Pooja deleted successfully.");
    },
    onError: () => setError("Unable to delete this pooja. It may be linked to bookings or protected by the server.")
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Poojas</CardTitle>
        <Button asChild><Link href="/poojas/new"><Plus className="h-4 w-4" />New Pooja</Link></Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {error && <p className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Temple</th><th className="px-5 py-3">Temple Amount</th><th className="px-5 py-3">Customer Base</th><th className="px-5 py-3">Selling Price</th><th className="px-5 py-3">Weekly</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8" colSpan={8}>Loading poojas</td></tr>}
            {data?.items.map((pooja) => (
              <tr key={pooja.id}>
                <td className="px-5 py-4 font-semibold">{pooja.name}</td>
                <td className="px-5 py-4">{pooja.templeName}</td>
                <td className="px-5 py-4">{formatCurrency(pooja.templeAmount)}</td>
                <td className="px-5 py-4">{formatCurrency(pooja.baseAmount)}</td>
                <td className="px-5 py-4">{formatCurrency(pooja.discountAmount)}</td>
                <td className="px-5 py-4">{pooja.isWeekly ? "Yes" : "No"}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pooja.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{pooja.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button asChild variant="outline" size="sm"><Link href={`/poojas/${pooja.id}`}><Eye className="h-4 w-4" />View</Link></Button><Button type="button" variant="destructive" size="sm" onClick={() => setSelectedPooja(pooja)}><Trash2 className="h-4 w-4" />Delete</Button></div></td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={8}>No poojas found.</td></tr>}
          </tbody>
        </table>
      </CardContent>
      <ConfirmDialog open={Boolean(selectedPooja)} title="Delete pooja?" description={`This will remove ${selectedPooja?.name ?? "this pooja"}.`} confirmLabel="Delete" destructive pending={deleteMutation.isPending} onCancel={() => setSelectedPooja(null)} onConfirm={() => selectedPooja && deleteMutation.mutate(selectedPooja.id)} />
    </Card>
  );
}
