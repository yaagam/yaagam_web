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
import { generateTranslations, getOffering, upsertOffering } from "@/services/ops.service";
import type { Language, Translation } from "@/types/ops";

const offeringTextSchema = z.object({ name: z.string(), description: z.string() });
const offeringSchema = z.object({
  actualPrice: z.coerce.number().positive("Actual price must be greater than 0."),
  discountPrice: z.coerce.number().min(0, "Discount price cannot be negative."),
  isActive: z.boolean(),
  english: offeringTextSchema.extend({
    name: z.string().min(1, "Name is required."),
    description: z.string().min(1, "Description is required.")
  }),
  translations: z.object({ ML: offeringTextSchema, HI: offeringTextSchema, MR: offeringTextSchema, TA: offeringTextSchema }),
  image: z.custom<FileList>().optional()
}).refine((value) => value.discountPrice <= value.actualPrice, {
  path: ["discountPrice"],
  message: "Discount price must be less than or equal to actual price."
});

type OfferingText = z.infer<typeof offeringTextSchema>;
type OfferingFormValues = z.input<typeof offeringSchema>;

const emptyText: OfferingText = { name: "", description: "" };
const defaultValues: OfferingFormValues = {
  actualPrice: 0,
  discountPrice: 0,
  isActive: true,
  english: emptyText,
  translations: { ML: emptyText, HI: emptyText, MR: emptyText, TA: emptyText }
};

function findTranslation(translations: Translation[] | undefined, language: Language): OfferingText {
  const translation = translations?.find((item) => item.language === language);
  return { name: translation?.name ?? "", description: translation?.description ?? "" };
}

function isComplete(value: OfferingText) {
  return Boolean(value.name.trim() && value.description.trim());
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(" ") : message;
  }
  return undefined;
}

export function OfferingForm() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const isEdit = Boolean(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [formError, setFormError] = useState("");
  const [translationError, setTranslationError] = useState("");
  const { data: offering, isLoading } = useQuery({ queryKey: ["offering", id], queryFn: () => getOffering(id as string), enabled: isEdit });
  const form = useForm<OfferingFormValues>({ resolver: zodResolver(offeringSchema), defaultValues });
  const english = useWatch({ control: form.control, name: "english" }) ?? emptyText;
  const translations = useWatch({ control: form.control, name: "translations" }) ?? defaultValues.translations;
  const [imagePreview, setImagePreview] = useState("");
  const imageField = form.register("image");
  const completedTranslations = targetLanguages.filter((language) => isComplete(translations[language])).length;

  useEffect(() => {
    if (!offering) return;
    form.reset({
      actualPrice: offering.actualPrice,
      discountPrice: offering.discountPrice,
      isActive: offering.isActive,
      english: findTranslation(offering.translations, "EN"),
      translations: {
        ML: findTranslation(offering.translations, "ML"),
        HI: findTranslation(offering.translations, "HI"),
        MR: findTranslation(offering.translations, "MR"),
        TA: findTranslation(offering.translations, "TA")
      }
    });
  }, [form, offering]);

  const generateMutation = useMutation({
    mutationFn: (source: OfferingText) => generateTranslations(source),
    onSuccess: (result) => {
      targetLanguages.forEach((language) => {
        if (result[language]) form.setValue(`translations.${language}`, result[language] as OfferingText, { shouldDirty: true, shouldValidate: true });
      });
      setTranslationError("");
    },
    onError: (error) => setTranslationError(getErrorMessage(error) ?? "Unable to generate translations. Try again.")
  });

  const saveMutation = useMutation({
    mutationFn: (values: OfferingFormValues) => upsertOffering(toFormData(values), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offerings"] });
      success(isEdit ? "Offering updated successfully." : "Offering created successfully.");
      router.replace("/offerings");
    },
    onError: (error) => setFormError(getErrorMessage(error) ?? "Unable to save offering. Check the fields and try again.")
  });

  function toFormData(values: OfferingFormValues) {
    const formData = new FormData();
    formData.set("actualPrice", String(Number(values.actualPrice)));
    formData.set("discountPrice", String(Number(values.discountPrice)));
    formData.set("isActive", String(values.isActive));
    formData.set("translations", JSON.stringify([
      { language: "EN", ...values.english },
      ...targetLanguages.map((language) => ({ language, ...values.translations[language] }))
    ]));
    const image = values.image?.item(0);
    if (image) formData.set("image", image);
    return formData;
  }

  function submit(values: OfferingFormValues) {
    if (!isEdit && !values.image?.item(0)) {
      form.setError("image", { message: "Image is required." });
      return;
    }
    setFormError("");
    saveMutation.mutate(values);
  }

  function generateFromEnglish() {
    if (!isComplete(english)) {
      setTranslationError("Fill English name and description before generating translations.");
      return;
    }
    generateMutation.mutate(english);
  }

  if (isEdit && isLoading) return <Card><CardContent>Loading offering</CardContent></Card>;
  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><Button asChild variant="ghost" size="sm" className="mb-2 px-0"><Link href="/offerings"><ArrowLeft className="h-4 w-4" />Offerings</Link></Button><CardTitle>{isEdit ? offering?.name ?? "Offering details" : "New Offering"}</CardTitle></div>
          <div className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground">Translations {completedTranslations}/{targetLanguages.length}</div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-6 lg:grid-cols-2">
          <label className="relative flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 lg:col-span-2">
            {(imagePreview || offering?.imageUrl) ? (
              <>
                <Image src={imagePreview || offering?.imageUrl || ""} alt="Offering preview" fill unoptimized className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-sm font-medium text-white">
                  {imagePreview ? "Image selected - click to replace" : "Click to replace offering image"}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-3">
                <ImageUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Upload offering image</span>
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              {...imageField}
              onChange={(event) => {
                void imageField.onChange(event);
                const image = event.target.files?.item(0);
                if (!image) {
                  setImagePreview("");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setImagePreview(typeof reader.result === "string" ? reader.result : "");
                reader.readAsDataURL(image);
              }}
            />
          </label>
          <FieldError message={errors.image?.message as string | undefined} />
          <div className="space-y-2"><Label>Actual Price</Label><Input type="number" min={0.01} step="0.01" {...form.register("actualPrice")} /><FieldError message={errors.actualPrice?.message} /></div>
          <div className="space-y-2"><Label>Discount Price</Label><Input type="number" min={0} step="0.01" {...form.register("discountPrice")} /><FieldError message={errors.discountPrice?.message} /></div>
          <label className="flex items-center gap-2 text-sm font-medium lg:col-span-2"><input type="checkbox" className="h-4 w-4 accent-primary" {...form.register("isActive")} /> Active offering</label>
          <section className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">English Source</h3><p className="text-sm text-muted-foreground">Generate uses this content to fill the translation fields.</p></div><Button type="button" variant="outline" onClick={generateFromEnglish} disabled={generateMutation.isPending}><Languages className="h-4 w-4" />{generateMutation.isPending ? "Generating" : "Generate Translations"}</Button></div>
            {translationError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{translationError}</p>}
            <div className="grid gap-4 rounded-md border border-border p-4"><div className="space-y-2"><Label>Name</Label><Input {...form.register("english.name")} /><FieldError message={errors.english?.name?.message} /></div><div className="space-y-2"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register("english.description")} /><FieldError message={errors.english?.description?.message} /></div></div>
          </section>
          <TranslationGrid isComplete={(language) => isComplete(translations[language])} renderFields={(language) => <><div className="space-y-2"><Label>Name</Label><Input {...form.register(`translations.${language}.name`)} /></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register(`translations.${language}.description`)} /></div></>} />
          {formError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive lg:col-span-2">{formError}</p>}
          <div className="flex justify-end gap-2 lg:col-span-2"><Button asChild type="button" variant="outline"><Link href="/offerings">Cancel</Link></Button><Button type="submit" disabled={saveMutation.isPending}><Save className="h-4 w-4" />{saveMutation.isPending ? "Saving" : isEdit ? "Save Changes" : "Create Offering"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
