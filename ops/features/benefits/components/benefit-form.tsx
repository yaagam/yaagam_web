"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Languages, Save } from "lucide-react";
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
import { generateTranslations, getBenefit, upsertBenefit } from "@/services/ops.service";
import type { Language, Translation } from "@/types/ops";

const textSchema = z.object({ name: z.string(), description: z.string() });
const schema = z.object({
  english: textSchema.extend({ name: z.string().min(1, "Name is required."), description: z.string().min(1, "Description is required.") }),
  translations: z.object({ ML: textSchema, HI: textSchema, MR: textSchema, TA: textSchema })
});
type Values = z.infer<typeof schema>;
const empty = { name: "", description: "" };
const defaults: Values = { english: empty, translations: { ML: empty, HI: empty, MR: empty, TA: empty } };
function findText(items: Translation[] | undefined, language: Language) {
  const translation = items?.find((item) => item.language === language);
  return { name: translation?.name ?? "", description: translation?.description ?? "" };
}
function errorMessage(error: unknown) { const value = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message; return Array.isArray(value) ? value.join(" ") : value; }

export function BenefitForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [formError, setFormError] = useState("");
  const [translationError, setTranslationError] = useState("");
  const { data: benefit, isLoading } = useQuery({ queryKey: ["benefit", id], queryFn: () => getBenefit(id as string), enabled: isEdit });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const english = useWatch({ control: form.control, name: "english" }) ?? empty;
  const translations = useWatch({ control: form.control, name: "translations" }) ?? defaults.translations;
  useEffect(() => { if (benefit) form.reset({ english: findText(benefit.translations, "EN"), translations: { ML: findText(benefit.translations, "ML"), HI: findText(benefit.translations, "HI"), MR: findText(benefit.translations, "MR"), TA: findText(benefit.translations, "TA") } }); }, [benefit, form]);

  const generate = useMutation({ mutationFn: () => generateTranslations(english), onSuccess: (result) => { targetLanguages.forEach((language) => { if (result[language]) form.setValue(`translations.${language}`, result[language] as { name: string; description: string }, { shouldDirty: true }); }); setTranslationError(""); }, onError: (error) => setTranslationError(errorMessage(error) ?? "Unable to generate translations.") });
  const save = useMutation({ mutationFn: (values: Values) => upsertBenefit([{ language: "EN", ...values.english }, ...targetLanguages.map((language) => ({ language, ...values.translations[language] }))], id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["benefits"] }); success(isEdit ? "Benefit updated successfully." : "Benefit created successfully."); router.replace("/benefits"); }, onError: (error) => setFormError(errorMessage(error) ?? "Unable to save benefit.") });
  if (isEdit && isLoading) return <Card><CardContent>Loading benefit</CardContent></Card>;
  const completed = targetLanguages.filter((language) => translations[language].name.trim() && translations[language].description.trim()).length;

  return <Card><CardHeader><div className="flex items-center justify-between"><div><Button asChild variant="ghost" size="sm" className="mb-2 px-0"><Link href="/benefits"><ArrowLeft className="h-4 w-4" />Benefits</Link></Button><CardTitle>{isEdit ? benefit?.name ?? "Benefit details" : "New Benefit"}</CardTitle></div><div className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground">Translations {completed}/{targetLanguages.length}</div></div></CardHeader><CardContent><form className="grid gap-6" onSubmit={form.handleSubmit((values) => { setFormError(""); save.mutate(values); })}>
    <section className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">English Source</h3><p className="text-sm text-muted-foreground">Generate uses this content to fill the translation fields.</p></div><Button type="button" variant="outline" disabled={generate.isPending} onClick={() => english.name.trim() && english.description.trim() ? generate.mutate() : setTranslationError("Fill the English name and description first.")}><Languages className="h-4 w-4" />{generate.isPending ? "Generating" : "Generate Translations"}</Button></div>{translationError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{translationError}</p>}<div className="grid gap-4 rounded-md border border-border p-4"><div className="space-y-2"><Label>Name</Label><Input {...form.register("english.name")} />{form.formState.errors.english?.name?.message && <p className="text-xs font-medium text-destructive">{form.formState.errors.english.name.message}</p>}</div><div className="space-y-2"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register("english.description")} />{form.formState.errors.english?.description?.message && <p className="text-xs font-medium text-destructive">{form.formState.errors.english.description.message}</p>}</div></div></section>
    <TranslationGrid isComplete={(language) => Boolean(translations[language].name.trim() && translations[language].description.trim())} renderFields={(language) => <><div className="space-y-2 md:col-span-3"><Label>Name</Label><Input {...form.register(`translations.${language}.name`)} /></div><div className="space-y-2 md:col-span-3"><Label>Description</Label><textarea className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" {...form.register(`translations.${language}.description`)} /></div></>} />
    {formError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-destructive">{formError}</p>}<div className="flex justify-end gap-2"><Button asChild type="button" variant="outline"><Link href="/benefits">Cancel</Link></Button><Button type="submit" disabled={save.isPending}><Save className="h-4 w-4" />{save.isPending ? "Saving" : isEdit ? "Save Changes" : "Create Benefit"}</Button></div>
  </form></CardContent></Card>;
}
