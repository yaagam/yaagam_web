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
import { PricingBreakdown } from "@/features/finance/components/pricing-breakdown";
import {
  targetLanguages,
  TranslationGrid,
} from "@/features/translations/components/translation-grid";
import {
  generateTranslations,
  getBenefits,
  getOfferings,
  getPooja,
  getTemples,
  syncPoojaWithZoho,
  upsertPooja,
} from "@/services/ops.service";
import type { Language, Translation } from "@/types/ops";

const poojaTextSchema = z.object({
  name: z.string(),
  about: z.string(),
  poojaFor: z.string(),
  mantra: z.string(),
  dos: z.string(),
  donts: z.string(),
});
const poojaDays = [
  "ANY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;
const poojaSchema = z
  .object({
    templeId: z.string().min(1, "Select a temple."),
    templeAmount: z.coerce
      .number()
      .positive("Temple amount must be greater than 0."),
    baseAmount: z.coerce
      .number()
      .positive("Customer base price must be greater than 0."),
    sellingPrice: z.coerce
      .number()
      .positive("Customer selling price must be greater than 0."),
    poojaDay: z
      .string()
      .refine(
        (day) => poojaDays.includes(day as (typeof poojaDays)[number]),
        "Select a valid pooja day.",
      ),
    time: z.string().min(1, "Time is required."),
    isWeekly: z.boolean(),
    recommendedWeeks: z.coerce
      .number()
      .refine(
        (value) => [2, 3, 4, 5].includes(value),
        "Select recommended weeks.",
      ),
    isActive: z.boolean(),
    benefitIds: z.array(z.string()).min(1, "Select at least one benefit."),
    offeringIds: z.array(z.string()),
    english: poojaTextSchema.extend({
      name: z.string().min(2, "English name is required."),
      about: z.string().min(1, "English about is required."),
      poojaFor: z.string().min(1, "English Pooja for is required."),
    }),
    translations: z.object({
      ML: poojaTextSchema,
      HI: poojaTextSchema,
      MR: poojaTextSchema,
      TA: poojaTextSchema,
    }),
    images: z.custom<FileList>().optional(),
    mantraChantCount: z.preprocess(
      (value) => value === "" || value === null ? undefined : value,
      z.coerce.number().int("Chant count must be a whole number.").min(1, "Chant count must be at least 1.").optional(),
    ),
  })
  .superRefine((value, context) => {
    if (value.sellingPrice > value.baseAmount) {
      context.addIssue({
        code: "custom",
        path: ["sellingPrice"],
        message: "Discount customer price cannot exceed base customer price.",
      });
    }
    if (value.sellingPrice < value.templeAmount) {
      context.addIssue({
        code: "custom",
        path: ["sellingPrice"],
        message: "Discount customer price cannot be less than temple amount.",
      });
    }
  });

type PoojaText = z.infer<typeof poojaTextSchema>;
type PoojaFormValues = z.input<typeof poojaSchema>;

const emptyText: PoojaText = { name: "", about: "", poojaFor: "", mantra: "", dos: "", donts: "" };
const defaultValues: PoojaFormValues = {
  templeId: "",
  templeAmount: 0,
  baseAmount: 0,
  sellingPrice: 0,
  poojaDay: "",
  time: "09:00",
  isWeekly: false,
  recommendedWeeks: 2,
  isActive: true,
  benefitIds: [],
  offeringIds: [],
  mantraChantCount: undefined,
  english: emptyText,
  translations: { ML: emptyText, HI: emptyText, MR: emptyText, TA: emptyText },
};

function findTranslation(
  translations: Translation[] | undefined,
  language: Language,
): PoojaText {
  const translation = translations?.find((item) => item.language === language);
  return {
    name: translation?.name ?? "",
    about: translation?.about ?? "",
    poojaFor: translation?.poojaFor ?? "",
    mantra: translation?.mantra ?? "",
    dos: (translation?.dos ?? []).join(", "),
    donts: (translation?.donts ?? []).join(", "),
  };
}

function isEnglishReady(english: PoojaText) {
  return Boolean(
    english.name.trim() && english.about.trim() && english.poojaFor.trim(),
  );
}

function isTranslationComplete(translation: PoojaText) {
  return Boolean(
    translation.name.trim() &&
    translation.about.trim() &&
    translation.poojaFor.trim(),
  );
}

function commaSeparatedItems(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function serializeTranslation(language: Language, value: PoojaText) {
  return {
    language,
    name: value.name,
    about: value.about,
    poojaFor: value.poojaFor,
    mantra: value.mantra.trim(),
    dos: commaSeparatedItems(value.dos),
    donts: commaSeparatedItems(value.donts),
  };
}

function toTranslations(values: PoojaFormValues) {
  return [
    serializeTranslation("EN", values.english),
    ...targetLanguages.map((language) => serializeTranslation(language, values.translations[language])),
  ];
}
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response?.data?.message;
    return Array.isArray(message) ? message.join(" ") : message;
  }
  return error instanceof Error ? error.message : undefined;
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [mantraAudio, setMantraAudio] = useState<File | null>(null);
  const [removeMantraAudio, setRemoveMantraAudio] = useState(false);
  const [mantraAudioError, setMantraAudioError] = useState("");
  const { data: pooja, isLoading } = useQuery({
    queryKey: ["pooja", id],
    queryFn: () => getPooja(id as string),
    enabled: isEdit,
  });
  const { data: temples } = useQuery({
    queryKey: ["temples", "options"],
    queryFn: () => getTemples({ page: 1, limit: 100 }),
  });
  const { data: benefits } = useQuery({
    queryKey: ["benefits", "options"],
    queryFn: () => getBenefits({ page: 1, limit: 100 }),
  });
  const { data: offerings } = useQuery({
    queryKey: ["offerings", "active-options"],
    queryFn: () => getOfferings({ page: 1, limit: 100, isActive: true }),
  });
  const form = useForm<PoojaFormValues>({
    resolver: zodResolver(poojaSchema),
    defaultValues,
  });
  const english =
    useWatch({ control: form.control, name: "english" }) ?? emptyText;
  const translations =
    useWatch({ control: form.control, name: "translations" }) ??
    defaultValues.translations;
  const completedTranslations = targetLanguages.filter((language) =>
    isTranslationComplete(translations[language]),
  ).length;
  const readyForTranslation = isEnglishReady(english);
  const poojaDay = useWatch({ control: form.control, name: "poojaDay" });
  const templeAmount = useWatch({ control: form.control, name: "templeAmount" });
  const baseAmount = useWatch({ control: form.control, name: "baseAmount" });
  const sellingPrice = useWatch({ control: form.control, name: "sellingPrice" });
  const mantraChantCount = useWatch({ control: form.control, name: "mantraChantCount" });
  const displayedChantCount =
    typeof mantraChantCount === "number" || typeof mantraChantCount === "string"
      ? Number(mantraChantCount)
      : null;
  const poojaDayRegistration = form.register("poojaDay");
  function handleImageChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImages((current) => {
      const next = [...current];
      next[index] = file;
      return next;
    });
    setImagePreviewUrls((current) => {
      if (current[index]) URL.revokeObjectURL(current[index]);
      const next = [...current];
      next[index] = URL.createObjectURL(file);
      return next;
    });
    event.target.value = "";
  }

  function removeSelectedImage(index: number) {
    setSelectedImages((current) => {
      const next = [...current];
      delete next[index];
      return next;
    });
    setImagePreviewUrls((current) => {
      if (current[index]) URL.revokeObjectURL(current[index]);
      const next = [...current];
      delete next[index];
      return next;
    });
  }

  function handleMantraAudio(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowedTypes = new Set(["audio/mpeg", "audio/mp4", "audio/ogg"]);
    const allowedExtensions = /\.(mp3|m4a|ogg)$/i;
    if (!allowedTypes.has(file.type) || !allowedExtensions.test(file.name)) {
      setMantraAudioError("Choose an MP3, M4A, or OGG audio file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMantraAudioError("Mantra audio must be 20 MB or smaller.");
      return;
    }
    setMantraAudio(file);
    setRemoveMantraAudio(false);
    setMantraAudioError("");
  }
  const generateMutation = useMutation({
    mutationFn: (source: PoojaText) => generateTranslations(source),
    onSuccess: (result) => {
      targetLanguages.forEach((language) => {
        const translated = result[language];
        if (translated)
          form.setValue(`translations.${language}`, translated, {
            shouldDirty: true,
            shouldValidate: true,
          });
      });
      setTranslationError("");
    },
    onError: (error) =>
      setTranslationError(
        error instanceof Error
          ? error.message
          : "Unable to generate translations. Try again.",
      ),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PoojaFormValues) =>
      upsertPooja(await toFormData(values), id),
    onSuccess: async (savedPooja) => {
      await queryClient.invalidateQueries({ queryKey: ["poojas"] });
      await queryClient.invalidateQueries({ queryKey: ["pooja", id] });
      success(
        isEdit
          ? "Pooja updated successfully."
          : savedPooja.zohoSyncStatus === "SYNCED"
            ? "Pooja created and Zoho item synced."
            : "Pooja created. Zoho item sync needs attention.",
      );
      router.replace(`/poojas/${savedPooja.id}`);
    },
    onError: (error) =>
      setSaveError(
        getErrorMessage(error) ??
          "Unable to save pooja. Check required fields and try again.",
      ),
  });
  const zohoSyncMutation = useMutation({
    mutationFn: () => syncPoojaWithZoho(id as string),
    onSuccess: async (syncedPooja) => {
      queryClient.setQueryData(["pooja", id], syncedPooja);
      await queryClient.invalidateQueries({ queryKey: ["poojas"] });
      success("Zoho item synced successfully.");
    },
  });

  useEffect(() => {
    if (!pooja) return;
    form.reset({
      templeId: pooja.templeId,
      templeAmount: pooja.templeAmount,
      baseAmount: pooja.baseAmount,
      sellingPrice: pooja.sellingPrice,
      poojaDay: pooja.poojaDay,
      time: pooja.time,
      isWeekly: pooja.isWeekly,
      recommendedWeeks: pooja.recommendedWeeks,
      isActive: pooja.isActive,
      benefitIds: pooja.benefitIds,
      offeringIds: pooja.offeringIds,
      mantraChantCount: pooja.mantraChantCount ?? undefined,
      english: findTranslation(pooja.translations, "EN"),
      translations: {
        ML: findTranslation(pooja.translations, "ML"),
        HI: findTranslation(pooja.translations, "HI"),
        MR: findTranslation(pooja.translations, "MR"),
        TA: findTranslation(pooja.translations, "TA"),
      },
    });
  }, [form, pooja]);

  async function toFormData(values: PoojaFormValues) {
    const formData = new FormData();
    formData.set("templeId", values.templeId);
    formData.set("templeAmount", String(Number(values.templeAmount)));
    formData.set("baseAmount", String(Number(values.baseAmount)));
    formData.set("sellingPrice", String(Number(values.sellingPrice)));
    formData.set("poojaDay", values.poojaDay);
    formData.set("time", values.time);
    formData.set("isWeekly", String(values.isWeekly));
    formData.set("recommendedWeeks", String(values.recommendedWeeks));
    formData.set("isActive", String(values.isActive));
    formData.set("benefitIds", JSON.stringify(values.benefitIds));
    formData.set("offeringIds", JSON.stringify(values.offeringIds));
    formData.set("translations", JSON.stringify(toTranslations(values)));
    if (values.mantraChantCount !== undefined && values.mantraChantCount !== null) {
      formData.append("mantraChantCount", String(values.mantraChantCount));
    }
    if (mantraAudio) {
      formData.append("mantraAudio", mantraAudio);
    } else if (isEdit && removeMantraAudio) {
      formData.append("removeMantraAudio", "true");
    }
    const replacements = Array.from({ length: 4 }, (_, slot) => ({
      slot,
      file: selectedImages[slot],
    })).filter((replacement): replacement is { slot: number; file: File } =>
      Boolean(replacement.file),
    );
    replacements.forEach(({ file }) => formData.append("images", file));
    if (isEdit && replacements.length > 0) {
      formData.set(
        "imageSlots",
        JSON.stringify(replacements.map(({ slot }) => slot)),
      );
    }
    return formData;
  }

  function generateFromEnglish() {
    const currentEnglish = form.getValues("english");

    if (!isEnglishReady(currentEnglish)) {
      setTranslationError(
        "Fill English name, badge sentence, and about before generating translations.",
      );
      return;
    }
    generateMutation.mutate(currentEnglish);
  }

  if (isEdit && isLoading)
    return (
      <Card>
        <CardContent>Loading pooja</CardContent>
      </Card>
    );

  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 px-0">
              <Link href="/poojas">
                <ArrowLeft className="h-4 w-4" />
                Poojas
              </Link>
            </Button>
            <CardTitle>
              {isEdit ? (pooja?.name ?? "Pooja details") : "New Pooja"}
            </CardTitle>
          </div>
          <div className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground">
            Translations {completedTranslations}/{targetLanguages.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pooja && (
          <div className="mb-6 grid gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Bookings</span>
              <p className="font-semibold">{pooja.counts?.bookings ?? 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Images</span>
              <p className="font-semibold">{pooja.imageUrls.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-semibold">
                {pooja.createdAt
                  ? new Date(pooja.createdAt).toLocaleDateString("en-IN")
                  : "-"}
              </p>
            </div>
          </div>
        )}

        {pooja && (
          <section className="mb-6 space-y-3 rounded-md border border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">Zoho Books item</h3>
                <p className="text-sm text-muted-foreground">
                  Item creation runs automatically using this Pooja&apos;s
                  Temple vendor.
                </p>
              </div>
              <span className="w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">
                {pooja.zohoSyncStatus}
              </span>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Item ID</span>
                <p className="break-all font-semibold">
                  {pooja.zohoItemId ?? "Not assigned"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last sync</span>
                <p className="font-semibold">
                  {pooja.lastZohoSyncAt
                    ? new Date(pooja.lastZohoSyncAt).toLocaleString("en-IN")
                    : "Never"}
                </p>
              </div>
            </div>
            {pooja.zohoSyncError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
                {pooja.zohoSyncError}
              </p>
            )}
            {zohoSyncMutation.isError && (
              <p className="text-sm font-medium text-destructive">
                {getErrorMessage(zohoSyncMutation.error) ??
                  "Unable to sync the Zoho item. Try again."}
              </p>
            )}
            {(pooja.zohoSyncStatus !== "SYNCED" || !pooja.zohoItemId) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => zohoSyncMutation.mutate()}
                disabled={zohoSyncMutation.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 ${zohoSyncMutation.isPending ? "animate-spin" : ""}`}
                />
                {zohoSyncMutation.isPending
                  ? "Syncing item"
                  : "Retry Zoho sync"}
              </Button>
            )}
          </section>
        )}
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="space-y-2">
            <Label>Temple</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              {...form.register("templeId")}
            >
              <option value="">Select temple</option>
              {temples?.items.map((temple) => (
                <option key={temple.id} value={temple.id}>
                  {temple.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.templeId?.message} />
          </div>
          <div className="space-y-2">
            <Label>Temple Pooja Amount</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              {...form.register("templeAmount")}
            />
            <FieldError message={errors.templeAmount?.message} />
          </div>
          <div className="space-y-2">
            <Label>Customer Base Price</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              {...form.register("baseAmount")}
            />
            <FieldError message={errors.baseAmount?.message} />
          </div>
          <div className="space-y-2">
            <Label>Customer Selling Price</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              {...form.register("sellingPrice")}
            />
            <FieldError message={errors.sellingPrice?.message} />
          </div>
          <PricingBreakdown
            listPrice={baseAmount}
            effectiveCustomerPrice={sellingPrice}
            templeAmount={templeAmount}
          />
          <div className="space-y-2">
            <Label>Pooja Day</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              {...poojaDayRegistration}
              onChange={(event) => {
                void poojaDayRegistration.onChange(event);
                if (!event.target.value || event.target.value === "ANY") {
                  form.setValue("isWeekly", false, { shouldDirty: true });
                  form.setValue("recommendedWeeks", 2, { shouldDirty: true });
                }
              }}
            >
              <option value="">Select pooja day</option>
              {poojaDays.map((day) => (
                <option key={day} value={day}>
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <FieldError message={errors.poojaDay?.message} />
            {poojaDay && poojaDay !== "ANY" && (
              <label className="flex items-center gap-2 pt-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...form.register("isWeekly")}
                />{" "}
                Weekly subscription
              </label>
            )}
          </div>
          {poojaDay && poojaDay !== "ANY" && (
            <div className="space-y-2">
              <Label>Recommended Weeks</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                {...form.register("recommendedWeeks")}
              >
                {[2, 3, 4, 5].map((weeks) => (
                  <option key={weeks} value={weeks}>
                    {weeks} weeks
                  </option>
                ))}
              </select>
              <FieldError message={errors.recommendedWeeks?.message} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Time</Label>
            <Input type="time" {...form.register("time")} />
            <FieldError message={errors.time?.message} />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-border p-4 lg:col-span-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              {...form.register("isActive")}
            />
            <span>
              <span className="block text-sm font-semibold">
                Active on Yaagam
              </span>
              <span className="block text-sm text-muted-foreground">
                When disabled, users cannot see or book this Pooja.
              </span>
            </span>
          </label>
          <div className="space-y-2 lg:col-span-2">
            <Label>Benefits</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {benefits?.items.map((benefit) => (
                <label
                  key={benefit.id}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    value={benefit.id}
                    {...form.register("benefitIds")}
                  />
                  {benefit.name}
                </label>
              ))}
            </div>
            <FieldError message={errors.benefitIds?.message} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Available Offerings</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {offerings?.items.map((offering) => (
                <label
                  key={offering.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    value={offering.id}
                    {...form.register("offeringIds")}
                  />
                  <span className="font-medium">{offering.name}</span>
                </label>
              ))}
            </div>
            {offerings?.items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active offerings available.
              </p>
            )}
          </div>
          <div className="space-y-3 lg:col-span-2">
            <div>
              <Label>Pooja Images</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Select up to 4 images. New selections replace the current
                previews.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => {
                const previewUrl =
                  imagePreviewUrls[index] ?? pooja?.imageUrls[index];
                return (
                  <div key={index} className="relative aspect-square">
                    <label className="flex h-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
                      {previewUrl ? (
                        <>
                          <img
                            src={previewUrl}
                            alt={`Pooja image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                            Replace
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageUp className="h-5 w-5" />
                          <span className="text-xs font-medium">
                            Add image {index + 1}
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => handleImageChange(index, event)}
                      />
                    </label>
                    {selectedImages[index] && (
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <section className="space-y-4 rounded-md border border-border p-4 lg:col-span-2">
            <div><h3 className="font-semibold">Mantra &amp; Guidelines</h3><p className="text-sm text-muted-foreground">Optional guidance from Panditji. Add translated guidance in each language below.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="mantra-chant-count">Chant count</Label><Input id="mantra-chant-count" type="number" min={1} step={1} placeholder="108" {...form.register("mantraChantCount")} /><FieldError message={errors.mantraChantCount?.message} /></div>
              <div className="space-y-2"><Label htmlFor="mantra-audio">Mantra voice audio</Label><Input id="mantra-audio" type="file" accept="audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg" onChange={handleMantraAudio} /><p className="text-xs text-muted-foreground">Optional MP3, M4A, or OGG file, up to 20 MB.</p>{mantraAudio&&<div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm"><span className="truncate">{mantraAudio.name}</span><Button type="button" size="sm" variant="ghost" onClick={()=>setMantraAudio(null)}>Remove selected</Button></div>}{mantraAudioError&&<p role="alert" className="text-xs font-medium text-destructive">{mantraAudioError}</p>}</div>
            </div>
            {pooja?.mantraAudioUrl&&!removeMantraAudio&&!mantraAudio&&<div className="space-y-2"><audio controls preload="none" className="w-full" src={pooja.mantraAudioUrl}>Your browser does not support audio playback.</audio><Button type="button" variant="outline" size="sm" onClick={()=>{setRemoveMantraAudio(true);setMantraAudioError("")}}>Remove audio</Button></div>}
            {removeMantraAudio&&!mantraAudio&&<p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Existing mantra audio will be removed when you save.</p>}
            <div className="grid gap-4 rounded-md bg-muted/30 p-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>English mantra</Label><textarea className="min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Om Gan Ganapataye Namah" {...form.register("english.mantra")} /></div><div className="space-y-2"><Label>English Do&apos;s</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Wake up before sunrise, Take a purifying bath" {...form.register("english.dos")} /></div><div className="space-y-2"><Label>English Don&apos;ts</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Avoid non-vegetarian food, Do not consume alcohol" {...form.register("english.donts")} /></div></div>
            {(english.mantra.trim()||commaSeparatedItems(english.dos).length>0||commaSeparatedItems(english.donts).length>0)&&<div className="space-y-3 rounded-md border border-border bg-card p-4"><h4 className="font-semibold">Guidelines of Puja from Panditji</h4>{english.mantra.trim()&&<div><p className="font-medium">1. Mantra Chanting</p><p className="mt-1 text-sm">{english.mantra.trim()}</p>{displayedChantCount !== null && displayedChantCount >= 1 && <p className="text-sm text-muted-foreground">Chant {displayedChantCount} times.</p>}</div>}{(commaSeparatedItems(english.dos).length>0||commaSeparatedItems(english.donts).length>0)&&<div><p className="font-medium">2. Dos &amp; Don&apos;ts</p>{commaSeparatedItems(english.dos).map(item=><p key={`do-${item}`} className="text-sm">âœ… {item}</p>)}{commaSeparatedItems(english.donts).map(item=><p key={`dont-${item}`} className="text-sm">âŒ {item}</p>)}</div>}</div>}
          </section>
          <section className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">English Source</h3>
                <p className="text-sm text-muted-foreground">
                  Generate uses this content to fill the translation fields.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateFromEnglish}
                disabled={generateMutation.isPending}
              >
                <Languages className="h-4 w-4" />
                {generateMutation.isPending
                  ? "Generating"
                  : "Generate Translations"}
              </Button>
            </div>
            {translationError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
                {translationError}
              </p>
            )}
            <div className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("english.name")} />
                <FieldError message={errors.english?.name?.message} />
              </div>
              <div className="space-y-2">
                <Label>Card badge sentence</Label>
                <Input
                  placeholder="e.g. Performed before starting a new business or career venture"
                  {...form.register("english.poojaFor")}
                />
                <FieldError message={errors.english?.poojaFor?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>About</Label>
                <textarea
                  className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  {...form.register("english.about")}
                />
                <FieldError message={errors.english?.about?.message} />
              </div>
            </div>
          </section>

          <TranslationGrid
            isComplete={(language) =>
              isTranslationComplete(translations[language])
            }
            renderFields={(language) => (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Name</Label>
                  <Input {...form.register(`translations.${language}.name`)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Card badge sentence</Label>
                  <Input
                    {...form.register(`translations.${language}.poojaFor`)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>About</Label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                    {...form.register(`translations.${language}.about`)}
                  />
                </div>
              </>
            )}
          />
          {saveError && (
            <p className="text-sm font-medium text-destructive lg:col-span-2">
              {saveError}
            </p>
          )}
          <div className="flex justify-end gap-2 lg:col-span-2">
            <Button asChild type="button" variant="outline">
              <Link href="/poojas">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" />
              {saveMutation.isPending
                ? isEdit
                  ? "Saving"
                  : "Creating and syncing"
                : isEdit
                  ? "Save Changes"
                  : "Create Pooja"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
