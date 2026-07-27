"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageUp, Languages, Save } from "lucide-react";
import Image from "next/image";
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
import { generateTranslations, getBenefits, getOfferings, getPooja, getTemples, upsertPooja } from "@/services/ops.service";
import type { Language, Translation } from "@/types/ops";

const poojaTextSchema = z.object({ name: z.string(), about: z.string() });
const poojaSchema = z.object({
  templeId: z.string().min(1, "Select a temple."),
  baseAmount: z.coerce.number().min(0, "Base amount is required."),
  poojaDay: z.string().min(1, "Pooja day is required."),
  time: z.string().min(1, "Time is required."),
  isWeekly: z.boolean(),
  weeklyDiscount: z.coerce.number().int().min(0),
  normalDiscount: z.coerce.number().int().min(0),
  benefitIds: z.array(z.string()),
  offeringIds: z.array(z.string()),
  english: poojaTextSchema.extend({ name: z.string().min(2, "English name is required."), about: z.string().min(1, "English about is required.") }),
  translations: z.object({ ML: poojaTextSchema, HI: poojaTextSchema, MR: poojaTextSchema, TA: poojaTextSchema }),
  images: z.custom<FileList>().optional()
});

type PoojaText = z.infer<typeof poojaTextSchema>;
type PoojaFormValues = z.input<typeof poojaSchema>;

const emptyText: PoojaText = { name: "", about: "" };
const defaultValues: PoojaFormValues = {
  templeId: "",
  baseAmount: 0,
  poojaDay: "",
  time: "00:00",
  isWeekly: false,
  weeklyDiscount: 0,
  normalDiscount: 0,
  benefitIds: [],
  offeringIds: [],
  english: emptyText,
  translations: { ML: emptyText, HI: emptyText, MR: emptyText, TA: emptyText }
};

function findTranslation(translations: Translation[] | undefined, language: Language): PoojaText {
  const translation = translations?.find((item) => item.language === language);
  return { name: translation?.name ?? "", about: translation?.about ?? "" };
}

function isEnglishReady(english: PoojaText) {
  return Boolean(english.name.trim() && english.about.trim());
}

function isTranslationComplete(translation: PoojaText) {
  return Boolean(translation.name.trim() && translation.about.trim());
}

function toTranslations(values: PoojaFormValues) {
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
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    return Array.isArray(message) ? message.join(" ") : message;
  }
  return undefined;
}

export function PoojaForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const isEdit = Boolean(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [translationError, setTranslationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const { data: pooja, isLoading } = useQuery({ queryKey: ["pooja", id], queryFn: () => getPooja(id as string), enabled: isEdit });
  const { data: temples } = useQuery({ queryKey: ["temples", "options"], queryFn: () => getTemples({ page: 1, limit: 100 }) });
  const { data: benefits } = useQuery({ queryKey: ["benefits", "options"], queryFn: () => getBenefits({ page: 1, limit: 100 }) });
  const { data: offerings } = useQuery({ queryKey: ["offerings", "active-options"], queryFn: () => getOfferings({ page: 1, limit: 100, isActive: true }) });
  const form = useForm<PoojaFormValues>({ resolver: zodResolver(poojaSchema), defaultValues });
  const english = useWatch({ control: form.control, name: "english" }) ?? emptyText;
  const translations = useWatch({ control: form.control, name: "translations" }) ?? defaultValues.translations;
  const completedTranslations = targetLanguages.filter((language) => isTranslationComplete(translations[language])).length;
  const readyForTranslation = isEnglishReady(english);

  const generateMutation = useMutation({
    mutationFn: (source: PoojaText) => generateTranslations(source),
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
    mutationFn: (values: PoojaFormValues) => upsertPooja(toFormData(values), id),
    onSuccess: async (savedPooja) => {
      await queryClient.invalidateQueries({ queryKey: ["poojas"] });
      await queryClient.invalidateQueries({ queryKey: ["pooja", id] });
      success(isEdit ? "Pooja updated successfully." : "Pooja created successfully.");
      router.replace(`/poojas/${savedPooja.id}`);
    },
    onError: (error) => setSaveError(getErrorMessage(error) ?? "Unable to save pooja. Check required fields and try again.")
  });

  useEffect(() => {
    if (!pooja) return;
    form.reset({
      templeId: pooja.templeId,
      baseAmount: pooja.price,
      poojaDay: pooja.poojaDay,
      time: pooja.time,
      isWeekly: pooja.isWeekly,
      weeklyDiscount: pooja.weeklyDiscount,
      normalDiscount: pooja.normalDiscount,
      benefitIds: pooja.benefitIds,
      offeringIds: pooja.offeringIds,
      english: findTranslation(pooja.translations, "EN"),
      translations: {
        ML: findTranslation(pooja.translations, "ML"),
        HI: findTranslation(pooja.translations, "HI"),
        MR: findTranslation(pooja.translations, "MR"),
        TA: findTranslation(pooja.translations, "TA")
      }
    });
  }, [form, pooja]);

  function toFormData(values: PoojaFormValues) {
    const formData = new FormData();
    formData.set("templeId", values.templeId);
    formData.set("baseAmount", String(Number(values.baseAmount)));
    formData.set("poojaDay", values.poojaDay);
    formData.set("time", values.time);
    formData.set("isWeekly", String(values.isWeekly));
    formData.set("weeklyDiscount", String(Number(values.weeklyDiscount)));
    formData.set("normalDiscount", String(Number(values.normalDiscount)));
    formData.set("benefitIds", JSON.stringify(values.benefitIds));
    formData.set("offeringIds", JSON.stringify(values.offeringIds));
    formData.set("translations", JSON.stringify(toTranslations(values)));
    Array.from(values.images ?? []).forEach((image) => formData.append("images", image));
    return formData;
  }

  function generateFromEnglish() {
    if (!readyForTranslation) {
      setTranslationError("Fill English name and about before generating translations.");
      return;
    }
    generateMutation.mutate(english);
  }

  if (isEdit && isLoading) return <Card><CardContent>Loading pooja</CardContent></Card>;

  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 px-0"><Link href="/poojas"><ArrowLeft className="h-4 w-4" />Poojas</Link></Button>
            <CardTitle>{isEdit ? pooja?.name ?? "Pooja details" : "New Pooja"}</CardTitle>
          </div>
          <div className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground">Translations {completedTranslations}/{targetLanguages.length}</div>
        </div>
      </CardHeader>
      <CardContent>
        {pooja?.imageUrls.length ? <div className="mb-6 grid gap-3 md:grid-cols-2">{pooja.imageUrls.map((imageUrl) => <div key={imageUrl} className="relative h-44 w-full overflow-hidden rounded-md"><Image src={imageUrl} alt={pooja.name} fill unoptimized className="object-cover" /></div>)}</div> : null}
        {pooja && <div className="mb-6 grid gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm md:grid-cols-3"><div><span className="text-muted-foreground">Bookings</span><p className="font-semibold">{pooja.counts?.bookings ?? 0}</p></div><div><span className="text-muted-foreground">Images</span><p className="font-semibold">{pooja.imageUrls.length}</p></div><div><span className="text-muted-foreground">Created</span><p className="font-semibold">{pooja.createdAt ? new Date(pooja.createdAt).toLocaleDateString("en-IN") : "-"}</p></div></div>}

        <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2"><Label>Temple</Label><select className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" {...form.register("templeId")}><option value="">Select temple</option>{temples?.items.map((temple) => <option key={temple.id} value={temple.id}>{temple.name}</option>)}</select><FieldError message={errors.templeId?.message} /></div>
          <div className="space-y-2"><Label>Base Amount</Label><Input type="number" min={0} {...form.register("baseAmount")} /><FieldError message={errors.baseAmount?.message} /></div>
          <div className="space-y-2"><Label>Pooja Day</Label><Input placeholder="Monday or Daily" {...form.register("poojaDay")} /><FieldError message={errors.poojaDay?.message} /></div>
          <div className="space-y-2"><Label>Time</Label><Input type="time" {...form.register("time")} /><FieldError message={errors.time?.message} /></div>
          <div className="space-y-2"><Label>Weekly Discount</Label><Input type="number" min={0} {...form.register("weeklyDiscount")} /></div>
          <div className="space-y-2"><Label>Normal Discount</Label><Input type="number" min={0} {...form.register("normalDiscount")} /></div>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-primary" {...form.register("isWeekly")} /> Weekly pooja</label>
          <div className="space-y-2 lg:col-span-2"><Label>Benefits</Label><div className="grid gap-2 md:grid-cols-2">{benefits?.items.map((benefit) => <label key={benefit.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input type="checkbox" value={benefit.id} {...form.register("benefitIds")} />{benefit.name}</label>)}</div></div>
          <div className="space-y-2 lg:col-span-2"><Label>Available Offerings</Label><div className="grid gap-2 md:grid-cols-2">{offerings?.items.map((offering) => <label key={offering.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"><input type="checkbox" value={offering.id} {...form.register("offeringIds")} /><span className="font-medium">{offering.name}</span></label>)}</div>{offerings?.items.length === 0 && <p className="text-sm text-muted-foreground">No active offerings available.</p>}</div>
          <label className="flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 lg:col-span-2"><ImageUp className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Upload up to 4 pooja images</span><input type="file" accept="image/*" multiple className="sr-only" {...form.register("images")} /></label>

          <section className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">English Source</h3><p className="text-sm text-muted-foreground">Generate uses this content to fill the translation fields.</p></div><Button type="button" variant="outline" onClick={generateFromEnglish} disabled={generateMutation.isPending}><Languages className="h-4 w-4" />{generateMutation.isPending ? "Generating" : readyForTranslation ? "Generate Translations" : "Fill English First"}</Button></div>
            {translationError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{translationError}</p>}
            <div className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-2"><div className="space-y-2"><Label>Name</Label><Input {...form.register("english.name")} /><FieldError message={errors.english?.name?.message} /></div><div className="space-y-2 md:col-span-2"><Label>About</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register("english.about")} /><FieldError message={errors.english?.about?.message} /></div></div>
          </section>

          <TranslationGrid isComplete={(language) => isTranslationComplete(translations[language])} renderFields={(language) => <><div className="space-y-2 md:col-span-2"><Label>Name</Label><Input {...form.register(`translations.${language}.name`)} /></div><div className="space-y-2 md:col-span-2"><Label>About</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register(`translations.${language}.about`)} /></div></>} />
          {saveError && <p className="text-sm font-medium text-destructive lg:col-span-2">{saveError}</p>}
          <div className="flex justify-end gap-2 lg:col-span-2"><Button asChild type="button" variant="outline"><Link href="/poojas">Cancel</Link></Button><Button type="submit" disabled={saveMutation.isPending}><Save className="h-4 w-4" />{saveMutation.isPending ? "Saving" : isEdit ? "Save Changes" : "Create Pooja"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}