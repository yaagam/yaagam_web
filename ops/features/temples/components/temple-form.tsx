"use client";

/* eslint-disable @next/next/no-img-element */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageUp, Languages, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { targetLanguages, TranslationGrid } from "@/features/translations/components/translation-grid";
import { generateTranslations, getTemple, syncTempleWithZoho, upsertTemple } from "@/services/ops.service";
import type { Language, TempleDetails, Translation } from "@/types/ops";

const templeTextSchema = z.object({ name: z.string(), district: z.string(), place: z.string(), description: z.string() });
const templeSchema = z.object({
  isActive: z.boolean(),
  email: z.union([z.literal(""), z.string().email("Enter a valid temple email.")]),
  state: z.string().min(2, "State is required."),
  templePriest: z.object({ name: z.string().min(2, "Priest name is required.").max(120), experience: z.string().min(1, "Priest experience is required.").max(500) }),
  english: templeTextSchema.extend({
    name: z.string().min(2, "English name is required."),
    district: z.string().min(1, "English district is required."),
    place: z.string().min(1, "English place is required."),
    description: z.string().min(1, "English description is required.")
  }),
  translations: z.object({ ML: templeTextSchema, HI: templeTextSchema, MR: templeTextSchema, TA: templeTextSchema }),
  image: z.custom<FileList>().optional()
});

type TempleText = z.infer<typeof templeTextSchema>;
type TempleFormValues = z.infer<typeof templeSchema>;

const emptyText: TempleText = { name: "", district: "", place: "", description: "" };
const defaultValues: TempleFormValues = {
  isActive: true,
  email: "",
  state: "",
  templePriest: { name: "", experience: "" },
  english: emptyText,
  translations: { ML: emptyText, HI: emptyText, MR: emptyText, TA: emptyText }
};

function findTranslation(translations: Translation[] | undefined, language: Language): TempleText {
  const translation = translations?.find((item) => item.language === language);
  return {
    name: translation?.name ?? "",
    district: translation?.district ?? "",
    place: translation?.place ?? "",
    description: translation?.description ?? ""
  };
}

function isEnglishReady(english: TempleText) {
  return Boolean(english.name.trim() && english.district.trim() && english.place.trim() && english.description.trim());
}

function isTranslationComplete(translation: TempleText) {
  return Boolean(translation.name.trim() && translation.district.trim() && translation.place.trim() && translation.description.trim());
}

function toTranslations(values: TempleFormValues) {
  return [
    { language: "EN", ...values.english },
    ...targetLanguages.map((language) => ({ language, ...values.translations[language] }))
  ];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function getErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  return Array.isArray(message) ? message.join(" ") : message;
}

export function TempleForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const isEdit = Boolean(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [translationError, setTranslationError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const { data: temple, isLoading, error: templeError, refetch, isFetching } = useQuery({ queryKey: ["temple", id], queryFn: () => getTemple(id as string), enabled: isEdit });
  const form = useForm<TempleFormValues>({ resolver: zodResolver(templeSchema), defaultValues });
  const english = useWatch({ control: form.control, name: "english" }) ?? emptyText;
  const translations = useWatch({ control: form.control, name: "translations" }) ?? defaultValues.translations;
  const completedTranslations = targetLanguages.filter((language) => isTranslationComplete(translations[language])).length;
  const readyForTranslation = isEnglishReady(english);
  const imageRegistration = form.register("image");

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    void imageRegistration.onChange(event);
    const image = event.target.files?.[0];
    setImagePreviewUrl(image ? URL.createObjectURL(image) : "");
  }

  const generateMutation = useMutation({
    mutationFn: (source: TempleText) => generateTranslations(source),
    onSuccess: (result) => {
      targetLanguages.forEach((language) => {
        const translated = result[language];
        if (translated) form.setValue(`translations.${language}`, translated, { shouldDirty: true, shouldValidate: true });
      });
      setTranslationError("");
    },
    onError: (error) => setTranslationError(error instanceof Error ? error.message : "Unable to generate translations. Try again.")
  });

  const saveMutation = useMutation({
    mutationFn: (values: TempleFormValues) => upsertTemple(toFormData(values), id),
    onSuccess: async (savedTemple) => {
      if (isEdit) {
        queryClient.setQueryData<TempleDetails | undefined>(["temple", id], (current) => current ? { ...current, ...savedTemple } : savedTemple);
      }
      setImagePreviewUrl("");
      form.resetField("image");
      await queryClient.invalidateQueries({ queryKey: ["temples"] });
      await queryClient.invalidateQueries({ queryKey: ["temple", id] });
      success(
        isEdit
          ? "Temple updated successfully."
          : savedTemple.zohoSyncStatus === "SYNCED"
            ? "Temple created and Zoho vendor synced."
            : "Temple created. Zoho vendor sync needs attention."
      );
      router.replace(`/temples/${savedTemple.id}`);
    }
  });
  const zohoSyncMutation = useMutation({
    mutationFn: () => syncTempleWithZoho(id as string),
    onSuccess: async (syncedTemple) => {
      queryClient.setQueryData(["temple", id], syncedTemple);
      await queryClient.invalidateQueries({ queryKey: ["temples"] });
      success("Zoho vendor synced successfully.");
    }
  });

  useEffect(() => {
    if (!temple) return;
    form.reset({
      isActive: temple.isActive,
      email: temple.email ?? "",
      state: temple.state,
      templePriest: temple.templePriest ?? { name: "", experience: "" },
      english: findTranslation(temple.translations, "EN"),
      translations: {
        ML: findTranslation(temple.translations, "ML"),
        HI: findTranslation(temple.translations, "HI"),
        MR: findTranslation(temple.translations, "MR"),
        TA: findTranslation(temple.translations, "TA")
      }
    });
  }, [form, temple]);

  function toFormData(values: TempleFormValues) {
    const formData = new FormData();
    formData.set("isActive", String(values.isActive));
    if (values.email.trim()) formData.set("email", values.email);
    formData.set("state", values.state);
    formData.set("templePriest", JSON.stringify(values.templePriest));
    formData.set("translations", JSON.stringify(toTranslations(values)));
    const image = values.image?.item(0);
    if (image) formData.set("image", image);
    return formData;
  }

  function generateFromEnglish() {
    if (!readyForTranslation) {
      setTranslationError("Fill English name, district, place, and description before generating translations.");
      return;
    }
    generateMutation.mutate(english);
  }

  if (isEdit && isLoading) return <Card><CardContent className="p-6">Loading temple details...</CardContent></Card>;
  if (isEdit && templeError) {
    return <Card><CardHeader><CardTitle>Unable to load temple</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-destructive">{getErrorMessage(templeError) ?? "The temple detail API request failed."}</p><div className="flex gap-2"><Button type="button" onClick={() => void refetch()} disabled={isFetching}>{isFetching ? "Retrying..." : "Retry"}</Button><Button asChild variant="outline"><Link href="/temples">Back to Temples</Link></Button></div></CardContent></Card>;
  }

  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 px-0"><Link href="/temples"><ArrowLeft className="h-4 w-4" />Temples</Link></Button>
            <CardTitle>{isEdit ? temple?.name ?? "Temple details" : "New Temple"}</CardTitle>
          </div>
          <div className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground">Translations {completedTranslations}/{targetLanguages.length}</div>
        </div>
      </CardHeader>
      <CardContent>
        {(imagePreviewUrl || temple?.imageUrl) && <div className="relative mb-6 h-52 w-full overflow-hidden rounded-md border border-border"><img src={imagePreviewUrl || temple?.imageUrl} alt={imagePreviewUrl ? "Selected temple image preview" : temple?.name ?? "Temple image"} className="h-full w-full object-cover" /><div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">{imagePreviewUrl ? "New image preview" : "Current image"}</div></div>}
        {temple && <div className="mb-6 grid gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm md:grid-cols-3"><div><span className="text-muted-foreground">Poojas</span><p className="font-semibold">{temple.counts?.poojas ?? 0}</p></div><div><span className="text-muted-foreground">Bookings</span><p className="font-semibold">{temple.counts?.bookings ?? 0}</p></div><div><span className="text-muted-foreground">Created</span><p className="font-semibold">{temple.createdAt ? new Date(temple.createdAt).toLocaleDateString("en-IN") : "-"}</p></div></div>}

        {temple && (
          <section className="mb-6 space-y-3 rounded-md border border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">Zoho Books vendor</h3>
                <p className="text-sm text-muted-foreground">Vendor creation runs automatically when a Temple is created.</p>
              </div>
              <span className="w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">{temple.zohoSyncStatus}</span>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div><span className="text-muted-foreground">Vendor ID</span><p className="break-all font-semibold">{temple.zohoVendorId ?? "Not assigned"}</p></div>
              <div><span className="text-muted-foreground">Last sync</span><p className="font-semibold">{temple.lastZohoSyncAt ? new Date(temple.lastZohoSyncAt).toLocaleString("en-IN") : "Never"}</p></div>
            </div>
            {temple.zohoSyncError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{temple.zohoSyncError}</p>}
            {zohoSyncMutation.isError && <p className="text-sm font-medium text-destructive">{getErrorMessage(zohoSyncMutation.error) ?? "Unable to sync the Zoho vendor. Try again."}</p>}
            {(temple.zohoSyncStatus !== "SYNCED" || !temple.zohoVendorId) && <Button type="button" variant="outline" onClick={() => zohoSyncMutation.mutate()} disabled={zohoSyncMutation.isPending}><RefreshCw className={`h-4 w-4 ${zohoSyncMutation.isPending ? "animate-spin" : ""}`} />{zohoSyncMutation.isPending ? "Syncing vendor" : "Retry Zoho sync"}</Button>}
          </section>
        )}
        <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="grid gap-6 lg:grid-cols-2">
          {!isEdit && <div className="space-y-2"><Label>Email</Label><Input type="email" required {...form.register("email")} /><FieldError message={errors.email?.message} /></div>}
          <div className="space-y-2"><Label>State</Label><Input {...form.register("state")} /><FieldError message={errors.state?.message} /></div>
          <section className="grid gap-4 rounded-md border border-border p-4 lg:col-span-2 md:grid-cols-2"><div className="md:col-span-2"><h3 className="font-semibold">Temple Priest</h3><p className="text-sm text-muted-foreground">Primary priest details for this temple.</p></div><div className="space-y-2"><Label>Priest Name</Label><Input {...form.register("templePriest.name")} /><FieldError message={errors.templePriest?.name?.message} /></div><div className="space-y-2"><Label>Experience</Label><Input placeholder="e.g. 15 years" {...form.register("templePriest.experience")} /><FieldError message={errors.templePriest?.experience?.message} /></div></section>
          <label className="flex items-start gap-3 rounded-md border border-border p-4 lg:col-span-2">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" {...form.register("isActive")} />
            <span>
              <span className="block text-sm font-semibold">Active on Yaagam</span>
              <span className="block text-sm text-muted-foreground">When disabled, this Temple and all of its Poojas are hidden from users. Individual Pooja statuses are preserved.</span>
            </span>
          </label>
          <label className="flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 lg:col-span-2"><ImageUp className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">{imagePreviewUrl ? "Change selected image" : temple?.imageUrl ? "Replace temple image" : "Upload temple image"}</span><input type="file" accept="image/*" className="sr-only" {...imageRegistration} onChange={handleImageChange} /></label>

          <section className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">English Source</h3><p className="text-sm text-muted-foreground">Generate uses this content to fill the translation fields.</p></div><Button type="button" variant="outline" onClick={generateFromEnglish} disabled={generateMutation.isPending}><Languages className="h-4 w-4" />{generateMutation.isPending ? "Generating" : readyForTranslation ? "Generate Translations" : "Fill English First"}</Button></div>
            {translationError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{translationError}</p>}
            <div className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-2"><div className="space-y-2"><Label>Name</Label><Input {...form.register("english.name")} /><FieldError message={errors.english?.name?.message} /></div><div className="space-y-2"><Label>District</Label><Input {...form.register("english.district")} /><FieldError message={errors.english?.district?.message} /></div><div className="space-y-2"><Label>Place</Label><Input {...form.register("english.place")} /><FieldError message={errors.english?.place?.message} /></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register("english.description")} /><FieldError message={errors.english?.description?.message} /></div></div>
          </section>

          <TranslationGrid isComplete={(language) => isTranslationComplete(translations[language])} renderFields={(language) => <><div className="space-y-2"><Label>Name</Label><Input {...form.register(`translations.${language}.name`)} /></div><div className="space-y-2"><Label>District</Label><Input {...form.register(`translations.${language}.district`)} /></div><div className="space-y-2"><Label>Place</Label><Input {...form.register(`translations.${language}.place`)} /></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register(`translations.${language}.description`)} /></div></>} />
          {saveMutation.isError && <p className="text-sm font-medium text-destructive lg:col-span-2">Unable to save temple. Check required fields and try again.</p>}
          <div className="flex justify-end gap-2 lg:col-span-2"><Button asChild type="button" variant="outline"><Link href="/temples">Cancel</Link></Button><Button type="submit" disabled={saveMutation.isPending || (isEdit && !form.formState.isDirty)}><Save className="h-4 w-4" />{saveMutation.isPending ? isEdit ? "Saving" : "Creating and syncing" : isEdit ? "Save Changes" : "Create Temple"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
