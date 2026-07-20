"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertTemple } from "@/services/ops.service";

const templeSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"]),
  image: z.custom<FileList>().optional()
});

type TempleFormValues = z.infer<typeof templeSchema>;

export function TempleForm() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<TempleFormValues>({
    resolver: zodResolver(templeSchema),
    defaultValues: { name: "", city: "", state: "", status: "DRAFT" }
  });

  async function onSubmit(values: TempleFormValues) {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("city", values.city);
    formData.set("state", values.state);
    formData.set("status", values.status);
    const image = values.image?.item(0);
    if (image) formData.set("image", image);
    await upsertTemple(formData);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Temple</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2"><Label>Name</Label><Input {...register("name")} /></div>
          <div className="space-y-2"><Label>City</Label><Input {...register("city")} /></div>
          <div className="space-y-2"><Label>State</Label><Input {...register("state")} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select {...register("status")} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <label className="flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 lg:col-span-2">
            <ImageUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Upload temple image</span>
            <input type="file" accept="image/*" className="sr-only" {...register("image")} />
          </label>
          <div className="lg:col-span-2"><Button type="submit" disabled={isSubmitting}>Save Temple</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}