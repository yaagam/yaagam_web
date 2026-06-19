"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImageIcon, Languages, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/ToastProvider";
import { APP_ROUTES } from "@/constants/route.const";
import {
  benifitLanguages,
  createBenifitApi,
  generateBenifitTranslationsApi,
  updateBenifitApi,
  type BenifitDetails,
  type BenifitLanguage,
  type BenifitMutationInput,
  type BenifitTranslationInput,
  type BenifitTranslationSourceInput,
} from "@/lib/api/admin/benifit/benifits.api";
import { getErrorMessage } from "@/lib/utils";

type BenifitFormMode = "create" | "update";

type BenifitFormProps = {
  mode: BenifitFormMode;
  benifit?: BenifitDetails;
};

type BenifitTranslationFormState = Record<
  BenifitLanguage,
  {
    name: string;
    description: string;
  }
>;

const languageLabels: Record<BenifitLanguage, string> = {
  EN: "English",
  ML: "Malayalam",
  HI: "Hindi",
  MR: "Marathi",
  TA: "Tamil",
};

function createEmptyTranslations(): BenifitTranslationFormState {
  return benifitLanguages.reduce((acc, language) => {
    acc[language] = {
      name: "",
      description: "",
    };

    return acc;
  }, {} as BenifitTranslationFormState);
}

function createTranslationState(benifit?: BenifitDetails) {
  const nextTranslations = createEmptyTranslations();

  for (const translation of benifit?.translations ?? []) {
    if (!benifitLanguages.includes(translation.language)) continue;

    nextTranslations[translation.language] = {
      name: translation.name,
      description: translation.description,
    };
  }

  return nextTranslations;
}

function getTranslationPayload(
  translations: BenifitTranslationFormState,
): BenifitTranslationInput[] {
  return benifitLanguages
    .map((language) => ({
      language,
      name: translations[language].name.trim(),
      description: translations[language].description.trim(),
    }))
    .filter((translation) => translation.name || translation.description);
}

function validateTranslations(translations: BenifitTranslationInput[]) {
  if (translations.length === 0) {
    return "Add at least one benifit translation.";
  }

  const incompleteTranslation = translations.find(
    (translation) => !translation.name || !translation.description,
  );

  if (incompleteTranslation) {
    return `Complete name and description for ${languageLabels[incompleteTranslation.language]}.`;
  }

  return "";
}

function getOriginalEnglishTranslation(
  benifit?: BenifitDetails,
): BenifitTranslationSourceInput | null {
  const englishTranslation = benifit?.translations.find(
    (translation) => translation.language === "EN",
  );

  if (!englishTranslation) return null;

  return {
    name: englishTranslation.name.trim(),
    description: englishTranslation.description.trim(),
  };
}

function isSameTranslationSource(
  first: BenifitTranslationSourceInput,
  second: BenifitTranslationSourceInput,
) {
  return (
    first.name === second.name && first.description === second.description
  );
}

function areTranslationStatesSame(
  first: BenifitTranslationFormState,
  second: BenifitTranslationFormState,
) {
  return benifitLanguages.every(
    (language) =>
      first[language].name.trim() === second[language].name.trim() &&
      first[language].description.trim() ===
        second[language].description.trim(),
  );
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function BenifitForm({ mode, benifit }: BenifitFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const imageObjectUrlRef = useRef("");
  const [translations, setTranslations] = useState(() =>
    createTranslationState(benifit),
  );
  const [image, setImage] = useState<File | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTranslations, setIsGeneratingTranslations] =
    useState(false);
  const title = mode === "create" ? "Create Benifit" : "Update Benifit";
  const imagePreview = imageObjectUrl || benifit?.imageUrl || "";
  const englishTranslation = {
    name: translations.EN.name.trim(),
    description: translations.EN.description.trim(),
  };
  const originalEnglishTranslation = getOriginalEnglishTranslation(benifit);
  const isEnglishUnchanged =
    mode === "update" &&
    originalEnglishTranslation !== null &&
    isSameTranslationSource(englishTranslation, originalEnglishTranslation);
  const isUpdateUnchanged =
    mode === "update" &&
    !image &&
    areTranslationStatesSame(translations, createTranslationState(benifit));

  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
      }
    };
  }, []);

  function handleImageChange(file: File | null) {
    if (file && !isImageFile(file)) {
      setError("Only image files are allowed.");
      return false;
    }

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = "";
    }

    setImage(file);

    if (!file) {
      setImageObjectUrl("");
      return;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = nextObjectUrl;
    setImageObjectUrl(nextObjectUrl);
    setError("");
    return true;
  }

  function updateTranslation(
    language: BenifitLanguage,
    field: keyof BenifitTranslationFormState[BenifitLanguage],
    value: string,
  ) {
    setTranslations((current) => ({
      ...current,
      [language]: {
        ...current[language],
        [field]: value,
      },
    }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const translationPayload = getTranslationPayload(translations);
    const validationError = validateTranslations(translationPayload);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isUpdateUnchanged) {
      setError("Make at least one change before updating the benifit.");
      return;
    }

    const input: BenifitMutationInput = {
      translations: translationPayload,
      image,
    };

    setIsSaving(true);
    setError("");

    try {
      const savedBenifit =
        mode === "create"
          ? await createBenifitApi(input)
          : await updateBenifitApi(benifit?.id ?? "", input);

      showToast(
        "success",
        mode === "create"
          ? "Benifit created successfully."
          : "Benifit updated successfully.",
      );
      router.push(APP_ROUTES.adminBenifitDetails(savedBenifit.id));
      router.refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save benifit."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateTranslations() {
    const validationError = validateTranslations([
      {
        language: "EN",
        ...englishTranslation,
      },
    ]);

    if (validationError) {
      setError("Complete English name and description before generating translations.");
      return;
    }

    if (isEnglishUnchanged) {
      setError("");
      showToast("success", "English details unchanged; translations not regenerated.");
      return;
    }

    setIsGeneratingTranslations(true);
    setError("");

    try {
      const generatedTranslations =
        await generateBenifitTranslationsApi(englishTranslation);

      setTranslations((current) => {
        const nextTranslations = { ...current };

        for (const language of benifitLanguages) {
          if (language === "EN") continue;

          const generatedTranslation = generatedTranslations[language];

          if (!generatedTranslation) continue;

          nextTranslations[language] = {
            name: generatedTranslation.name,
            description: generatedTranslation.description,
          };
        }

        return nextTranslations;
      });
      showToast("success", "Translations generated successfully.");
    } catch (generateError: unknown) {
      setError(
        getErrorMessage(
          generateError,
          "Unable to generate benifit translations.",
        ),
      );
    } finally {
      setIsGeneratingTranslations(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-saffron">
            Benifit Management
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-text-primary">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={isGeneratingTranslations || isEnglishUnchanged}
            onClick={handleGenerateTranslations}
            className="min-h-11 rounded-lg"
          >
            {isGeneratingTranslations ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            Generate translations
          </Button>

          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <Link href={APP_ROUTES.adminBenifits}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to benifits
            </Link>
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-5">
          {benifitLanguages.map((language) => (
            <section
              key={language}
              className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-extrabold text-text-primary">
                {languageLabels[language]}
              </h3>
              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Name
                  </span>
                  <Input
                    value={translations[language].name}
                    onChange={(event) =>
                      updateTranslation(language, "name", event.target.value)
                    }
                    placeholder="Benifit name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Description
                  </span>
                  <textarea
                    value={translations[language].description}
                    onChange={(event) =>
                      updateTranslation(
                        language,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Benifit description"
                    rows={4}
                    className="w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-semibold leading-7 text-text-primary shadow-sm outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                  />
                </label>
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Benifit Image
            </h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-black/10 bg-[#f8fafc]">
              <div className="relative aspect-4/3">
                {imageObjectUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageObjectUrl}
                    alt="Benifit preview"
                    className="h-full w-full object-cover"
                  />
                ) : imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Benifit preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-primary/35">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const isValidFile = handleImageChange(
                  event.target.files?.[0] ?? null,
                );

                if (!isValidFile) event.currentTarget.value = "";
              }}
              className="mt-4 file:mr-3 file:rounded-md file:border-0 file:bg-saffron file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
            />
          </section>

          {benifit?._count && (
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-text-primary">
                Linked Records
              </h3>
              <div className="mt-4 rounded-lg bg-saffron/10 p-3">
                <p className="text-xs font-extrabold uppercase text-saffron">
                  Poojas
                </p>
                <p className="mt-1 text-2xl font-extrabold text-text-primary">
                  {benifit._count.poojas}
                </p>
              </div>
            </section>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSaving || isUpdateUnchanged}
            className="min-h-12 w-full rounded-lg text-base font-extrabold"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving" : title}
          </Button>
        </aside>
      </form>
    </section>
  );
}
