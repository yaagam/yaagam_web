"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { deleteTemple, getTemples } from "@/services/ops.service";
import type { Temple } from "@/types/ops";

export function TemplesList() {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["temples"], queryFn: () => getTemples({ page: 1, limit: 20 }) });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemple(id),
    onSuccess: async () => {
      setSelectedTemple(null);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["temples"] });
      success("Temple deleted successfully.");
    },
    onError: () => setError("Temple cannot be deleted while poojas or bookings are linked to it.")
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Temples</CardTitle>
        <Button asChild><Link href="/temples/new"><Plus className="h-4 w-4" />New Temple</Link></Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {error && <p className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Place</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8" colSpan={5}>Loading temples</td></tr>}
            {data?.items.map((temple) => (
              <tr key={temple.id}>
                <td className="px-5 py-4 font-semibold">{temple.name}</td>
                <td className="px-5 py-4">{temple.city}</td>
                <td className="px-5 py-4">{temple.state}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${temple.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{temple.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm"><Link href={`/temples/${temple.id}`}><Eye className="h-4 w-4" />View</Link></Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => setSelectedTemple(temple)}><Trash2 className="h-4 w-4" />Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && <tr><td className="px-5 py-8 text-muted-foreground" colSpan={5}>No temples found.</td></tr>}
          </tbody>
        </table>
      </CardContent>
      <ConfirmDialog
        open={Boolean(selectedTemple)}
        title="Delete temple?"
        description={`This will remove ${selectedTemple?.name ?? "this temple"}. Temples linked to poojas or bookings cannot be deleted.`}
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onCancel={() => setSelectedTemple(null)}
        onConfirm={() => selectedTemple && deleteMutation.mutate(selectedTemple.id)}
      />
    </Card>
  );
}
