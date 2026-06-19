"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { PoojaForm } from "@/components/admin/PoojaForm";
import {
  getPoojaDetailsApi,
  type PoojaDetails,
} from "@/lib/api/admin/pooja/poojas.api";
import { getErrorMessage } from "@/lib/utils";

type PoojaDetailsPanelProps = {
  poojaId: string;
};

export function PoojaDetailsPanel({ poojaId }: PoojaDetailsPanelProps) {
  const [pooja, setPooja] = useState<PoojaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadPooja() {
      setIsLoading(true);
      setError("");

      try {
        const nextPooja = await getPoojaDetailsApi(poojaId);

        if (isActive) setPooja(nextPooja);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load pooja."));
          setPooja(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [poojaId]);

  if (isLoading) {
    return (
      <div className="flex min-h-120 items-center justify-center gap-3 text-text-primary/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">Loading pooja</span>
      </div>
    );
  }

  if (error || !pooja) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:px-8">
        <h2 className="text-2xl font-extrabold text-text-primary">
          Could not load pooja
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Pooja not found."}
        </p>
      </section>
    );
  }

  return <PoojaForm mode="update" pooja={pooja} />;
}
