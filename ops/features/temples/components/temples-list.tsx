"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemples } from "@/services/ops.service";

export function TemplesList() {
  const { data, isLoading } = useQuery({ queryKey: ["temples"], queryFn: () => getTemples({ page: 1, limit: 20 }) });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Temples</CardTitle>
        <Button asChild><Link href="/temples/new"><Plus className="h-4 w-4" />New Temple</Link></Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">City</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td className="px-5 py-8" colSpan={4}>Loading temples</td></tr>}
            {data?.items.map((temple) => <tr key={temple.id}><td className="px-5 py-4 font-semibold">{temple.name}</td><td className="px-5 py-4">{temple.city}</td><td className="px-5 py-4">{temple.state}</td><td className="px-5 py-4">{temple.status}</td></tr>)}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}