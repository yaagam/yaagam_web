"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { BenifitForm } from "@/components/admin/BenifitForm";
import {
  getBenifitDetailsApi,
  type BenifitDetails,
} from "@/lib/api/admin/benifit/benifits.api";
import { getErrorMessage } from "@/lib/utils";

type BenifitDetailsPanelProps = {
  benifitId: string;
};

export function BenifitDetailsPanel({ benifitId }: BenifitDetailsPanelProps) {
  const [benifit, setBenifit] = useState<BenifitDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadBenifit() {
      setIsLoading(true);
      setError("");

      try {
        const nextBenifit = await getBenifitDetailsApi(benifitId);

        if (isActive) setBenifit(nextBenifit);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load benifit."));
          setBenifit(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadBenifit();

    return () => {
      isActive = false;
    };
  }, [benifitId]);

  if (isLoading) {
    return (
      <div className="flex min-h-120 items-center justify-center gap-3 text-text-primary/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">Loading benifit</span>
      </div>
    );
  }

  if (error || !benifit) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:px-8">
        <h2 className="text-2xl font-extrabold text-text-primary">
          Could not load benifit
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Benifit not found."}
        </p>
      </section>
    );
  }

  return <BenifitForm mode="update" benifit={benifit} />;
}
