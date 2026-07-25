"use client";

import type { ReactNode } from "react";
import type { Language } from "@/types/ops";

export const targetLanguages = ["ML", "HI", "MR", "TA"] as const;

export const languageLabels: Record<Language, string> = {
  EN: "English",
  ML: "Malayalam",
  HI: "Hindi",
  MR: "Marathi",
  TA: "Tamil"
};

type TargetLanguage = (typeof targetLanguages)[number];

type TranslationGridProps = {
  isComplete: (language: TargetLanguage) => boolean;
  renderFields: (language: TargetLanguage) => ReactNode;
};

export function TranslationGrid({ isComplete, renderFields }: TranslationGridProps) {
  return (
    <section className="space-y-4 lg:col-span-2">
      <h3 className="font-semibold">Translations</h3>
      <div className="grid gap-4 xl:grid-cols-2">
        {targetLanguages.map((language) => (
          <div key={language} className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-2">
            <div className="flex items-center justify-between md:col-span-2">
              <h4 className="font-semibold">{languageLabels[language]}</h4>
              <span className="text-xs font-medium text-muted-foreground">{isComplete(language) ? "Complete" : "Needs review"}</span>
            </div>
            {renderFields(language)}
          </div>
        ))}
      </div>
    </section>
  );
}
