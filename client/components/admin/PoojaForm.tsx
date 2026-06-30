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
  getAdminBenifitsApi,
  type Benifit,
  type BenifitTranslation,
} from "@/lib/api/admin/benifit/benifits.api";
import {
  getAdminTemplesApi,
  type Temple,
  type TempleTranslation,
} from "@/lib/api/admin/temple/temples.api";
import {
  generatePoojaTranslationsApi,
  poojaLanguages,
  createPoojaApi,
  updatePoojaApi,
  type PoojaDetails,
  type PoojaLanguage,
  type PoojaMutationInput,
  type PoojaTranslationInput,
  type PoojaTranslationSourceInput,
} from "@/lib/api/admin/pooja/poojas.api";
import {
  ADMIN_IMAGE_SLOT_COUNT,
  ADMIN_LANGUAGE_LABELS,
  POOJA_DAYS,
} from "@/constants/admin-form.const";
import { getErrorMessage } from "@/lib/utils";

type PoojaFormMode = "create" | "update";

type PoojaFormProps = {
  mode: PoojaFormMode;
  pooja?: PoojaDetails;
};

type PoojaTranslationFormState = Record<
  PoojaLanguage,
  {
    name: string;
    about: string;
  }
>;

function getPrimaryTempleTranslation(translations: TempleTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function getPrimaryBenifitTranslation(translations: BenifitTranslation[]) {
  return (
    translations.find((translation) => translation.language === "EN") ??
    translations[0] ??
    null
  );
}

function createEmptyTranslations(): PoojaTranslationFormState {
  return poojaLanguages.reduce((acc, language) => {
    acc[language] = {
      name: "",
      about: "",
    };

    return acc;
  }, {} as PoojaTranslationFormState);
}

function createTranslationState(pooja?: PoojaDetails) {
  const nextTranslations = createEmptyTranslations();

  for (const translation of pooja?.translations ?? []) {
    if (!poojaLanguages.includes(translation.language)) continue;

    nextTranslations[translation.language] = {
      name: translation.name,
      about: translation.about,
    };
  }

  return nextTranslations;
}

function getTranslationPayload(
  translations: PoojaTranslationFormState,
): PoojaTranslationInput[] {
  return poojaLanguages
    .map((language) => ({
      language,
      name: translations[language].name.trim(),
      about: translations[language].about.trim(),
    }))
    .filter((translation) => translation.name || translation.about);
}

function validateTranslations(translations: PoojaTranslationInput[]) {
  if (translations.length === 0) {
    return "Add at least one pooja translation.";
  }

  const incompleteTranslation = translations.find(
    (translation) => !translation.name || !translation.about,
  );

  if (incompleteTranslation) {
    return `Complete name and about for ${ADMIN_LANGUAGE_LABELS[incompleteTranslation.language]}.`;
  }

  return "";
}

function getOriginalEnglishTranslation(
  pooja?: PoojaDetails,
): PoojaTranslationSourceInput | null {
  const englishTranslation = pooja?.translations.find(
    (translation) => translation.language === "EN",
  );

  if (!englishTranslation) return null;

  return {
    name: englishTranslation.name.trim(),
    about: englishTranslation.about.trim(),
  };
}

function isSameTranslationSource(
  first: PoojaTranslationSourceInput,
  second: PoojaTranslationSourceInput,
) {
  return first.name === second.name && first.about === second.about;
}

function areTranslationStatesSame(
  first: PoojaTranslationFormState,
  second: PoojaTranslationFormState,
) {
  return poojaLanguages.every(
    (language) =>
      first[language].name.trim() === second[language].name.trim() &&
      first[language].about.trim() === second[language].about.trim(),
  );
}

function normalizeAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  return String(value);
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function PoojaForm({ mode, pooja }: PoojaFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const imageObjectUrlsRef = useRef<string[]>([]);
  const [translations, setTranslations] = useState(() =>
    createTranslationState(pooja),
  );
  const [templeId, setTempleId] = useState(pooja?.templeId ?? "");
  const [baseAmount, setBaseAmount] = useState(
    normalizeAmount(pooja?.baseAmount),
  );
  const [poojaDay, setPoojaDay] = useState(pooja?.poojaDay ?? "");
  const [poojaTime, setPoojaTime] = useState(
    pooja?.time ?? pooja?.poojaTime ?? "",
  );
  const [isWeekly, setIsWeekly] = useState(pooja?.isWeekly ?? false);
  const [weeklyDiscount, setWeeklyDiscount] = useState(
    String(pooja?.weeklyDiscount ?? 0),
  );
  const [normalDiscount, setNormalDiscount] = useState(
    String(pooja?.normalDiscount ?? 0),
  );
  const [benefitIds, setBenefitIds] = useState<string[]>(
    () => pooja?.benefits.map((benefit) => benefit.id) ?? [],
  );
  const [images, setImages] = useState<Array<File | null>>(() =>
    Array.from({ length: ADMIN_IMAGE_SLOT_COUNT }, () => null),
  );
  const [imageObjectUrls, setImageObjectUrls] = useState<string[]>(() =>
    Array.from({ length: ADMIN_IMAGE_SLOT_COUNT }, () => ""),
  );
  const [temples, setTemples] = useState<Temple[]>([]);
  const [benifits, setBenifits] = useState<Benifit[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTranslations, setIsGeneratingTranslations] =
    useState(false);
  const title = mode === "create" ? "Create Pooja" : "Update Pooja";
  const selectedImages = images.filter((image): image is File =>
    Boolean(image),
  );
  const hasNewImages = selectedImages.length > 0;
  const existingImageCount = pooja?.imageUrls?.length ?? 0;
  const englishTranslation = {
    name: translations.EN.name.trim(),
    about: translations.EN.about.trim(),
  };
  const originalEnglishTranslation = getOriginalEnglishTranslation(pooja);
  const isEnglishUnchanged =
    mode === "update" &&
    originalEnglishTranslation !== null &&
    isSameTranslationSource(englishTranslation, originalEnglishTranslation);
  const sortedBenefitIds = [...benefitIds].sort().join("|");
  const sortedOriginalBenefitIds =
    pooja?.benefits
      .map((benefit) => benefit.id)
      .sort()
      .join("|") ?? "";
  const isUpdateUnchanged =
    mode === "update" &&
    !hasNewImages &&
    templeId === (pooja?.templeId ?? "") &&
    baseAmount.trim() === normalizeAmount(pooja?.baseAmount) &&
    poojaDay.trim() === (pooja?.poojaDay ?? "") &&
    poojaTime.trim() === (pooja?.time ?? pooja?.poojaTime ?? "") &&
    isWeekly === (pooja?.isWeekly ?? false) &&
    Number(weeklyDiscount || 0) === (pooja?.weeklyDiscount ?? 0) &&
    Number(normalDiscount || 0) === (pooja?.normalDiscount ?? 0) &&
    sortedBenefitIds === sortedOriginalBenefitIds &&
    areTranslationStatesSame(translations, createTranslationState(pooja));

  useEffect(() => {
    let isActive = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [templeResponse, benifitResponse] = await Promise.all([
          getAdminTemplesApi({ limit: 100 }),
          getAdminBenifitsApi({ limit: 100 }),
        ]);

        if (!isActive) return;

        setTemples(templeResponse.items);
        setBenifits(benifitResponse.items);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load pooja options."));
        }
      } finally {
        if (isActive) setIsLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const objectUrls = imageObjectUrlsRef.current;

    return () => {
      for (const objectUrl of objectUrls) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  function handleImageChange(index: number, file: File | null) {
    if (file && !isImageFile(file)) {
      setError("Only image files are allowed.");
      return false;
    }

    const currentObjectUrl = imageObjectUrlsRef.current[index];

    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      imageObjectUrlsRef.current[index] = "";
    }

    setImages((current) => {
      const nextImages = [...current];
      nextImages[index] = file;
      return nextImages;
    });

    setImageObjectUrls((current) => {
      const nextObjectUrls = [...current];
      nextObjectUrls[index] = file ? URL.createObjectURL(file) : "";
      imageObjectUrlsRef.current[index] = nextObjectUrls[index];
      return nextObjectUrls;
    });
    setError("");
    return true;
  }

  function updateTranslation(
    language: PoojaLanguage,
    field: keyof PoojaTranslationFormState[PoojaLanguage],
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

  function toggleBenefit(benefitId: string) {
    setBenefitIds((current) =>
      current.includes(benefitId)
        ? current.filter((id) => id !== benefitId)
        : [...current, benefitId],
    );
    setError("");
  }

  function getImagePreview(index: number) {
    if (hasNewImages) return imageObjectUrls[index] || "";

    return pooja?.imageUrls?.[index] ?? "";
  }

  function buildInput(translationPayload: PoojaTranslationInput[]) {
    return {
      templeId: templeId.trim(),
      baseAmount: baseAmount.trim(),
      poojaDay: poojaDay.trim(),
      poojaTime: poojaTime.trim(),
      isWeekly,
      weeklyDiscount: Number(weeklyDiscount || 0),
      normalDiscount: Number(normalDiscount || 0),
      benefitIds,
      translations: translationPayload,
      images: selectedImages,
    } satisfies PoojaMutationInput;
  }

  function validatePoojaInput(input: PoojaMutationInput) {
    const imageCount = input.images?.length ?? 0;

    if (!input.templeId) return "Select a temple.";
    if (!input.baseAmount) return "Enter the base amount.";
    if (!input.poojaDay) return "Enter the pooja day.";
    if (!input.poojaTime) return "Enter the pooja time.";
    if (input.benefitIds.length === 0) return "Select at least one benifit.";
    if (mode === "create" && imageCount === 0) {
      return "Add at least one pooja image.";
    }
    if (imageCount > ADMIN_IMAGE_SLOT_COUNT) {
      return "Pooja can have a maximum of 4 images.";
    }
    if (mode === "update" && existingImageCount === 0 && imageCount === 0) {
      return "Add at least one pooja image.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const translationPayload = getTranslationPayload(translations);
    const translationError = validateTranslations(translationPayload);

    if (translationError) {
      setError(translationError);
      return;
    }

    const input = buildInput(translationPayload);
    const inputError = validatePoojaInput(input);

    if (inputError) {
      setError(inputError);
      return;
    }

    if (isUpdateUnchanged) {
      setError("Make at least one change before updating the pooja.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const savedPooja =
        mode === "create"
          ? await createPoojaApi(input)
          : await updatePoojaApi(pooja?.id ?? "", input);

      showToast(
        "success",
        mode === "create"
          ? "Pooja created successfully."
          : "Pooja updated successfully.",
      );
      router.push(APP_ROUTES.adminPoojaDetails(savedPooja.id));
      router.refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Unable to save pooja."));
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
      setError(
        "Complete English name and about before generating translations.",
      );
      return;
    }

    if (isEnglishUnchanged) {
      setError("");
      showToast(
        "success",
        "English details unchanged; translations not regenerated.",
      );
      return;
    }

    setIsGeneratingTranslations(true);
    setError("");

    try {
      const generatedTranslations =
        await generatePoojaTranslationsApi(englishTranslation);

      setTranslations((current) => {
        const nextTranslations = { ...current };

        for (const language of poojaLanguages) {
          if (language === "EN") continue;

          const generatedTranslation = generatedTranslations[language];

          if (!generatedTranslation) continue;

          nextTranslations[language] = {
            name: generatedTranslation.name,
            about: generatedTranslation.about,
          };
        }

        return nextTranslations;
      });
      showToast("success", "Translations generated successfully.");
    } catch (generateError: unknown) {
      setError(
        getErrorMessage(
          generateError,
          "Unable to generate pooja translations.",
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
            Pooja Management
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
            <Link href={APP_ROUTES.adminPoojas}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to poojas
            </Link>
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <div className="space-y-5">
          {poojaLanguages.map((language) => (
            <section
              key={language}
              className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-extrabold text-text-primary">
                {ADMIN_LANGUAGE_LABELS[language]}
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
                    placeholder="Pooja name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    About
                  </span>
                  <textarea
                    value={translations[language].about}
                    onChange={(event) =>
                      updateTranslation(language, "about", event.target.value)
                    }
                    placeholder="About this pooja"
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
              Pooja Details
            </h3>
            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary/70">
                  Temple
                </span>
                <select
                  value={templeId}
                  disabled={isLoadingOptions}
                  onChange={(event) => {
                    setTempleId(event.target.value);
                    setError("");
                  }}
                  className="h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-semibold text-text-primary shadow-sm outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/10 disabled:opacity-60"
                >
                  <option value="">Select temple</option>
                  {temples.map((temple) => {
                    const primary = getPrimaryTempleTranslation(
                      temple.translations,
                    );

                    return (
                      <option key={temple.id} value={temple.id}>
                        {primary?.name ?? temple.id}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary/70">
                  Base Amount
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={baseAmount}
                  onChange={(event) => {
                    setBaseAmount(event.target.value);
                    setError("");
                  }}
                  placeholder="0.00"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary/70">
                  Pooja Day
                </span>
                <select
                  value={poojaDay}
                  onChange={(event) => {
                    setPoojaDay(event.target.value);
                    setError("");
                  }}
                  className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-text-primary outline-none transition-colors focus:border-saffron"
                >
                  <option value="">Select Pooja Day</option>
                  {POOJA_DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-text-primary/70">
                  Pooja Time
                </span>
                <Input
                  type="time"
                  value={poojaTime}
                  onChange={(event) => {
                    setPoojaTime(event.target.value);
                    setError("");
                  }}
                />
              </label>

              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-black/10 px-4">
                <input
                  type="checkbox"
                  checked={isWeekly}
                  onChange={(event) => {
                    setIsWeekly(event.target.checked);
                    setError("");
                  }}
                  className="h-4 w-4 accent-saffron"
                />
                <span className="text-sm font-extrabold text-text-primary">
                  Weekly pooja
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Weekly Discount
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={weeklyDiscount}
                    onChange={(event) => {
                      setWeeklyDiscount(event.target.value);
                      setError("");
                    }}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-text-primary/70">
                    Normal Discount
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={normalDiscount}
                    onChange={(event) => {
                      setNormalDiscount(event.target.value);
                      setError("");
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Benifits
            </h3>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {benifits.length === 0 ? (
                <p className="text-sm font-semibold leading-6 text-text-primary/55">
                  {isLoadingOptions ? "Loading benifits" : "No benifits found"}
                </p>
              ) : (
                benifits.map((benifit) => {
                  const primary = getPrimaryBenifitTranslation(
                    benifit.translations,
                  );

                  return (
                    <label
                      key={benifit.id}
                      className="flex items-start gap-3 rounded-lg border border-black/10 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={benefitIds.includes(benifit.id)}
                        onChange={() => toggleBenefit(benifit.id)}
                        className="mt-1 h-4 w-4 accent-saffron"
                      />
                      <span className="min-w-0 text-sm font-bold leading-6 text-text-primary">
                        {primary?.name ?? benifit.id}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-text-primary">
              Pooja Images
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: ADMIN_IMAGE_SLOT_COUNT }).map(
                (_, index) => {
                  const preview = getImagePreview(index);

                  return (
                    <div key={index} className="space-y-3">
                      <div className="overflow-hidden rounded-lg border border-black/10 bg-[#f8fafc]">
                        <div className="relative aspect-4/3">
                          {preview ? (
                            imageObjectUrls[index] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={preview}
                                alt={`Pooja preview ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image
                                src={preview}
                                alt={`Pooja preview ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center text-text-primary/35">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const isValidFile = handleImageChange(
                            index,
                            event.target.files?.[0] ?? null,
                          );

                          if (!isValidFile) event.currentTarget.value = "";
                        }}
                        className="file:mr-3 file:rounded-md file:border-0 file:bg-saffron file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
                      />
                    </div>
                  );
                },
              )}
            </div>
          </section>

          {pooja?._count && (
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold text-text-primary">
                Linked Records
              </h3>
              <div className="mt-4 rounded-lg bg-saffron/10 p-3">
                <p className="text-xs font-extrabold uppercase text-saffron">
                  Bookings
                </p>
                <p className="mt-1 text-2xl font-extrabold text-text-primary">
                  {pooja._count.bookings}
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
