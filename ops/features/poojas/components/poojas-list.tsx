"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPoojas } from "@/services/ops.service";
import { formatCurrency } from "@/lib/utils";

export function PoojasList() {
  const { data, isLoading } = useQuery({ queryKey: ["poojas"], queryFn: () => getPoojas({ page: 1, limit: 20 }) });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Poojas</CardTitle>
        <Button asChild><Link href="/poojas/new"><Plus className="h-4 w-4" />New Pooja</Link></Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Temple</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Weekly</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8" colSpan={5}>Loading poojas</td></tr>}
            {data?.items.map((pooja) => <tr key={pooja.id}><td className="px-5 py-4 font-semibold">{pooja.name}</td><td className="px-5 py-4">{pooja.templeName}</td><td className="px-5 py-4">{formatCurrency(pooja.price)}</td><td className="px-5 py-4">{pooja.isWeekly ? "Yes" : "No"}</td><td className="px-5 py-4">{pooja.status}</td></tr>)}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}