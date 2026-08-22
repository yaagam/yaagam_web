"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Search, Check } from "lucide-react";
import type { PoojaCategoryFilter } from "@/lib/api/pooja/poojas.api";
import type { Benifit } from "@/lib/api/benifit/benifits.api";
import type { Temple } from "@/lib/api/temple/temples.api";
import { cn } from "@/lib/utils";
import type { PoojasBrowserDbLanguage } from "@/constants/poojas-browser.const";

type PoojasFilterDialogProps = {
  activeCategory: PoojaCategoryFilter;
  activeBenifitId: string;
  activeTempleId: string;
  benifits: Benifit[];
  temples: Temple[];
  selectedDbLanguage: PoojasBrowserDbLanguage;
  getBenifitLabel: (
    benifit: Benifit,
    language: PoojasBrowserDbLanguage,
  ) => string;
  getTempleLabel: (temple: Temple, language: PoojasBrowserDbLanguage) => string;
  onApply: (
    category: PoojaCategoryFilter,
    benifitId: string,
    templeId: string,
  ) => void;
  activeFilterCount: number;
};

const TABS = [
  { id: "pujaType", label: "Pooja Type" },
  { id: "benefit", label: "Benefit" },
  { id: "templeType", label: "Temple Type" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PoojasFilterDialog({
  activeCategory,
  activeBenifitId,
  activeTempleId,
  benifits,
  temples,
  selectedDbLanguage,
  getBenifitLabel,
  getTempleLabel,
  onApply,
  activeFilterCount,
}: PoojasFilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("pujaType");

  const [tempCategory, setTempCategory] =
    useState<PoojaCategoryFilter>(activeCategory);
  const [tempBenifitId, setTempBenifitId] = useState(activeBenifitId);
  const [tempTempleId, setTempTempleId] = useState(activeTempleId);

  const [searchBenefit, setSearchBenefit] = useState("");
  const [searchTemple, setSearchTemple] = useState("");

  const filteredBenefits = useMemo(() => {
    if (!searchBenefit.trim()) return benifits;
    const query = searchBenefit.toLowerCase();
    return benifits.filter((b) =>
      getBenifitLabel(b, selectedDbLanguage).toLowerCase().includes(query),
    );
  }, [benifits, searchBenefit, selectedDbLanguage, getBenifitLabel]);

  const filteredTemples = useMemo(() => {
    if (!searchTemple.trim()) return temples;
    const query = searchTemple.toLowerCase();
    return temples.filter((t) =>
      getTempleLabel(t, selectedDbLanguage).toLowerCase().includes(query),
    );
  }, [temples, searchTemple, selectedDbLanguage, getTempleLabel]);

  const handleApply = () => {
    onApply(tempCategory, tempBenifitId, tempTempleId);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempCategory("");
    setTempBenifitId("");
    setTempTempleId("");
  };

  const tempFilterCount = [tempCategory, tempBenifitId, tempTempleId].filter(
    Boolean,
  ).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setTempCategory(activeCategory);
          setTempBenifitId(activeBenifitId);
          setTempTempleId(activeTempleId);
          setSearchBenefit("");
          setSearchTemple("");
          setActiveTab("pujaType");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex h-[3.25rem] w-full shrink-0 items-center justify-center gap-2 rounded-full border-black/10 bg-white text-sm font-semibold text-text-primary hover:bg-black/5 sm:w-[120px]"
        >
          <Filter className="h-4 w-4 text-saffron" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="poojas-filter-dialog flex max-h-[90vh] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[700px]">
        <DialogHeader className="border-b border-black/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-extrabold text-text-primary">
              Filters
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex min-h-[400px] flex-1 flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="flex flex-shrink-0 flex-row overflow-x-auto border-b border-black/10 bg-[#f9fafb] md:w-[240px] md:flex-col md:border-b-0 md:border-r">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex h-14 min-w-[120px] items-center justify-start px-6 text-sm font-medium transition-colors md:w-full",
                  activeTab === tab.id
                    ? "bg-white text-text-primary"
                    : "text-text-primary/60 hover:bg-black/5",
                )}
              >
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-saffron md:bottom-auto md:left-0 md:top-0 md:h-full md:w-1" />
                )}
                {tab.label}
                {tab.id === "pujaType" && tempCategory && (
                  <span className="ml-1 text-saffron">*</span>
                )}
                {tab.id === "benefit" && tempBenifitId && (
                  <span className="ml-1 text-saffron">*</span>
                )}
                {tab.id === "templeType" && tempTempleId && (
                  <span className="ml-1 text-saffron">*</span>
                )}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-primary/50">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h3>

            {activeTab === "pujaType" && (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/5">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      tempCategory === "normal"
                        ? "border-saffron bg-saffron"
                        : "border-black/20",
                    )}
                  >
                    {tempCategory === "normal" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tempCategory === "normal"}
                    onChange={(e) =>
                      setTempCategory(e.target.checked ? "normal" : "")
                    }
                  />
                  <span className="text-sm font-medium text-text-primary">
                    One Day Pooja
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/5">
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      tempCategory === "weekly"
                        ? "border-saffron bg-saffron"
                        : "border-black/20",
                    )}
                  >
                    {tempCategory === "weekly" && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tempCategory === "weekly"}
                    onChange={(e) =>
                      setTempCategory(e.target.checked ? "weekly" : "")
                    }
                  />
                  <span className="text-sm font-medium text-text-primary">
                    Weekly Pooja
                  </span>
                </label>
              </div>
            )}

            {activeTab === "benefit" && (
              <div className="flex min-h-0 flex-col">
                <div className="mb-4 relative shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/40" />
                  <input
                    type="text"
                    placeholder="Search benefits..."
                    value={searchBenefit}
                    onChange={(e) => setSearchBenefit(e.target.value)}
                    className="h-10 w-full rounded-lg border border-black/10 pl-9 pr-3 text-sm font-semibold outline-none focus:border-saffron"
                  />
                </div>
                <div className="overflow-y-auto pr-2 scrollbar-thumb-saffron">
                  <div className="space-y-1">
                    {filteredBenefits.map((b) => (
                      <label
                        key={b.slug}
                        className="flex cursor-pointer items-center gap-4 rounded-md p-2 transition-colors hover:bg-black/5"
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            tempBenifitId === b.slug
                              ? "border-saffron bg-saffron"
                              : "border-black/20",
                          )}
                        >
                          {tempBenifitId === b.slug && (
                            <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={tempBenifitId === b.slug}
                          onChange={(e) =>
                            setTempBenifitId(e.target.checked ? b.slug : "")
                          }
                        />
                        {b.imageUrl && (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white">
                            <Image
                              src={b.imageUrl}
                              alt={getBenifitLabel(b, selectedDbLanguage)}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-text-primary">
                          {getBenifitLabel(b, selectedDbLanguage)}
                        </span>
                      </label>
                    ))}
                    {filteredBenefits.length === 0 && (
                      <p className="py-4 text-center text-sm font-semibold text-text-primary/50">
                        No benefits found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "templeType" && (
              <div className="flex min-h-0 flex-col">
                <div className="mb-4 relative shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-primary/40" />
                  <input
                    type="text"
                    placeholder="Search temples..."
                    value={searchTemple}
                    onChange={(e) => setSearchTemple(e.target.value)}
                    className="h-10 w-full rounded-lg border border-black/10 pl-9 pr-3 text-sm font-semibold outline-none focus:border-saffron"
                  />
                </div>
                <div className="overflow-y-auto pr-2 scrollbar-thumb-saffron">
                  <div className="space-y-1">
                    {filteredTemples.map((t) => (
                      <label
                        key={t.slug}
                        className="flex cursor-pointer items-center gap-4 rounded-md p-2 transition-colors hover:bg-black/5"
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            tempTempleId === t.slug
                              ? "border-saffron bg-saffron"
                              : "border-black/20",
                          )}
                        >
                          {tempTempleId === t.slug && (
                            <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={tempTempleId === t.slug}
                          onChange={(e) =>
                            setTempTempleId(e.target.checked ? t.slug : "")
                          }
                        />
                        {t.imageUrl && (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white">
                            <Image
                              src={t.imageUrl}
                              alt={getTempleLabel(t, selectedDbLanguage)}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="text-sm font-semibold text-text-primary">
                          {getTempleLabel(t, selectedDbLanguage)}
                        </span>
                      </label>
                    ))}
                    {filteredTemples.length === 0 && (
                      <p className="py-4 text-center text-sm font-semibold text-text-primary/50">
                        No temples found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearAll}
            disabled={tempFilterCount === 0}
            className="text-sm font-medium text-text-primary/60 hover:text-text-primary"
          >
            Clear All
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-saffron px-8 text-sm font-semibold text-white hover:bg-[#c96c1a]"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
