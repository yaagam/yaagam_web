"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { TempleForm } from "@/components/admin/TempleForm";
import {
  getTempleDetailsApi,
  type TempleDetails,
} from "@/lib/api/admin/temples.api";
import { getErrorMessage } from "@/lib/utils";

type TempleDetailsPanelProps = {
  templeId: string;
};

export function TempleDetailsPanel({ templeId }: TempleDetailsPanelProps) {
  const [temple, setTemple] = useState<TempleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadTemple() {
      setIsLoading(true);
      setError("");

      try {
        const nextTemple = await getTempleDetailsApi(templeId);

        if (isActive) setTemple(nextTemple);
      } catch (loadError: unknown) {
        if (isActive) {
          setError(getErrorMessage(loadError, "Unable to load temple."));
          setTemple(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadTemple();

    return () => {
      isActive = false;
    };
  }, [templeId]);

  if (isLoading) {
    return (
      <div className="flex min-h-120 items-center justify-center gap-3 text-text-primary/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">Loading temple</span>
      </div>
    );
  }

  if (error || !temple) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center md:px-8">
        <h2 className="text-2xl font-extrabold text-text-primary">
          Could not load temple
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || "Temple not found."}
        </p>
      </section>
    );
  }

  return <TempleForm mode="update" temple={temple} />;
}
