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
  createTempleApi,
  generateTempleTranslationsApi,
  templeLanguages,
  updateTempleApi,
  type TempleDetails,
  type TempleLanguage,
  type TempleMutationInput,
  type TempleTranslationInput,
  type TempleTranslationSourceInput,
} from "@/lib/api/admin/temple/temples.api";
import { ADMIN_INDIAN_STATES, ADMIN_LANGUAGE_LABELS } from "@/constants/admin-form.const";
import { getErrorMessage } from "@/lib/utils";

type TempleFormMode = "create" | "update";

type TempleFormProps = {
  mode: TempleFormMode;
  temple?: TempleDetails;
};

type TempleTranslationFormState = Record<
  TempleLanguage,
  {
    name: string;
    district: string;
    place: string;
    description: string;
  }
>;



function createEmptyTranslations(): TempleTranslationFormState {
  return templeLanguages.reduce((acc, language) => {
    acc[language] = {
      name: "",
      district: "",
      place: "",
      description: "",
    };

    return acc;
  }, {} as TempleTranslationFormState);
}

function createTranslationState(temple?: TempleDetails) {
  const nextTranslations = createEmptyTranslations();

  for (const translation of temple?.translations ?? []) {
    if (!templeLanguages.includes(translation.language)) continue;

    nextTranslations[translation.language] = {
      name: translation.name,
      district: translation.district,
      place: translation.place,
      description: translation.description ?? "",
    };
  }

  return nextTranslations;
}

function getTranslationPayload(
  translations: TempleTranslationFormState,
): TempleTranslationInput[] {
  return templeLanguages
    .map((language) => ({
      language,
      name: translations[language].name.trim(),
      district: translations[language].district.trim(),
      place: translations[language].place.trim(),
      description: translations[language].description.trim(),
    }))
    .filter(
      (translation) =>
        translation.name ||
        translation.district ||
        translation.place ||
        translation.description,
    );
}

function validateTranslations(translations: TempleTranslationInput[]) {
  if (translations.length === 0) {
    return "Add at least one temple translation.";
  }

  const incompleteTranslation = translations.find(
    (translation) =>
      !translation.name ||
      !translation.district ||
      !translation.place ||
      !translation.description,
  );

  if (incompleteTranslation) {
    return `Complete name, district, place, and description for ${ADMIN_LANGUAGE_LABELS[incompleteTranslation.language]}.`;
  }

  return "";
}

function getOriginalEnglishTranslation(
  temple?: TempleDetails,
): TempleTranslationSourceInput | null {
  const englishTranslation = temple?.translations.find(
    (translation) => translation.language === "EN",
  );

  if (!englishTranslation) return null;

  return {
    name: englishTranslation.name.trim(),
    district: englishTranslation.district.trim(),
    place: englishTranslation.place.trim(),
    description: englishTranslation.description?.trim() ?? "",
  };
}

function isSameTranslationSource(
  first: TempleTranslationSourceInput,
  second: TempleTranslationSourceInput,
) {
  return (
    first.name === second.name &&
    first.district === second.district &&
    first.place === second.place &&
    first.description === second.description
  );
}

function areTranslationStatesSame(
  first: TempleTranslationFormState,
  second: TempleTranslationFormState,
) {
  return templeLanguages.every((language) =>
    isSameTranslationSource(
      {
        name: first[language].name.trim(),
        district: first[language].district.trim(),
        place: first[language].place.trim(),
        description: first[language].description.trim(),
      },
      {
        name: second[language].name.trim(),
        district: second[language].district.trim(),
        place: second[language].place.trim(),
        description: second[language].description.trim(),
      },
    ),
  );
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function TempleForm({ mode, temple }: TempleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const imageObjectUrlRef = useRef("");
  const [translations, setTranslations] = useState(() =>
    createTranslationState(temple),
  );
  const [state, setState] = useState(temple?.state ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTranslations, setIsGeneratingTranslations] =
    useState(false);
  const title = mode === "create" ? "Create Temple" : "Update Temple";
  const imagePreview = imageObjectUrl || temple?.imageUrl || "";
  const englishTranslation = {
    name: translations.EN.name.trim(),
    district: translations.EN.district.trim(),
    place: translations.EN.place.trim(),
    description: translations.EN.description.trim(),
  };
  const originalEnglishTranslation = getOriginalEnglishTranslation(temple);
  const isEnglishUnchanged =
    mode === "update" &&
    originalEnglishTranslation !== null &&
    isSameTranslationSource(englishTranslation, originalEnglishTranslation);
  const isUpdateUnchanged =
    mode === "update" &&
    !image &&
    state.trim() === (temple?.state ?? "").trim() &&
    areTranslationStatesSame(translations, createTranslationState(temple));

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
    language: TempleLanguage,
    field: keyof TempleTranslationFormState[TempleLanguage],
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
    const normalizedState = state.trim();
    const validationError = validateTranslations(translationPayload);

    if (!normalizedState) {
      setError("Select a state.");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isUpdateUnchanged) {
      setError("Make at least one change before updating the temple.");
      return;
    }

    const input: TempleMutationInput = {
      state: normalizedState,
      translations: translationPayload,
      image,
    };

    setIsSaving(true);
    setError("");

    try {
      const savedTemple =
        mode === "create"
          ? await createTempleApi(input)
          : await updateTempleApi(temple?.id ?? "", input);

      showToast(
        "success",
        mode === "create"
          ? "Temple created successfully."
          : "Temple updated successfully.",
      );
      router.push(APP_ROUTES.adminTempleDetails(savedTemple.id));
      router.refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save temple."));
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
      setError("Complete English name, district, place, and description before generating translations.");
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
        await generateTempleTranslationsApi(englishTranslation);

      setTranslations((current) => {
        const nextTranslations = { ...current };

        for (const language of templeLanguages) {
          if (language === "EN") continue;

          const generatedTranslation = generatedTranslations[language];

          if (!generatedTranslation) continue;

          nextTranslations[language] = {
            name: generatedTranslation.name,
            district: generatedTranslation.district,
            place: generatedTranslation.place,
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
          "Unable to generate temple translations.",
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
            Temple Management
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
            <Link href={APP_ROUTES.adminTemples}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to temples
            </Link>
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-5">
          {templeLanguages.map((language) => (
            <section
              key={language}
              className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-extrabold text-text-primary">
                {ADMIN_LANGUAGE_LABELS[language]}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Name
                  </span>
                  <Input
                    value={translations[language].name}
                    onChange={(event) =>
                      updateTranslation(language, "name", event.target.value)
                    }
                    placeholder="Temple name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    District
                  </span>
                  <Input
                    value={translations[language].district}
                    onChange={(event) =>
                      updateTranslation(language, "district", event.target.value)
                    }
                    placeholder="District"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Place
                  </span>
                  <Input
                    value={translations[language].place}
                    onChange={(event) =>
                      updateTranslation(language, "place", event.target.value)
                    }
                    placeholder="Place"
                  />
                </label>
                <label className="space-y-2 md:col-span-3">
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
                    placeholder="Temple description"
                    rows={4}
                    className="min-h-28 w-full resize-y rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-text-primary shadow-sm outline-none transition placeholder:text-text-primary/35 focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                  />
                </label>
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Temple Location
            </h3>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-bold text-text-primary/70">
                State
              </span>
              <select
                value={state}
                onChange={(event) => {
                  setState(event.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-semibold text-text-primary shadow-sm outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10"
              >
                <option value="">Select state</option>
                {ADMIN_INDIAN_STATES.map((stateOption) => (
                  <option key={stateOption.isoCode} value={stateOption.name}>
                    {stateOption.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Temple Image
            </h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-black/10 bg-[#f8fafc]">
              <div className="relative aspect-4/3">
                {imageObjectUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageObjectUrl}
                    alt="Temple preview"
                    className="h-full w-full object-cover"
                  />
                ) : imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Temple preview"
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

          {temple?._count && (
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-text-primary">
                Linked Records
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-saffron/10 p-3">
                  <p className="text-xs font-extrabold uppercase text-saffron">
                    Poojas
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-text-primary">
                    {temple._count.poojas}
                  </p>
                </div>
                <div className="rounded-lg bg-saffron/10 p-3">
                  <p className="text-xs font-extrabold uppercase text-saffron">
                    Bookings
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-text-primary">
                    {temple._count.bookings}
                  </p>
                </div>
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
