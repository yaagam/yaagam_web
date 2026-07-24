"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertPooja } from "@/services/ops.service";

const poojaSchema = z.object({
  name: z.string().min(2),
  templeId: z.string().min(1),
  price: z.coerce.number().positive(),
  isWeekly: z.boolean(),
  weekdays: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"])
});

type PoojaFormValues = z.input<typeof poojaSchema>;

export function PoojaForm() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<PoojaFormValues>({
    resolver: zodResolver(poojaSchema),
    defaultValues: { name: "", templeId: "", price: 0, isWeekly: false, weekdays: "", status: "DRAFT" }
  });

  return (
    <Card>
      <CardHeader><CardTitle>Pooja</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((values) => upsertPooja(values))} className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2"><Label>Name</Label><Input {...register("name")} /></div>
          <div className="space-y-2"><Label>Temple mapping</Label><Input placeholder="Temple ID" {...register("templeId")} /></div>
          <div className="space-y-2"><Label>Pricing</Label><Input type="number" {...register("price")} /></div>
          <div className="space-y-2"><Label>Weekly options</Label><Input placeholder="MON,WED,FRI" {...register("weekdays")} /></div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-primary" {...register("isWeekly")} /> Weekly pooja</label>
          <div className="space-y-2">
            <Label>Status</Label>
            <select {...register("status")} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="lg:col-span-2"><Button type="submit" disabled={isSubmitting}>Save Pooja</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}