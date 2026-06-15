"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Info, MapPin } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface PoojaCardProps {
  title: string;
  location: string;
  price: string;
  image: string;
  dayBadge: string;
  stateBadge: string;
}

export function PoojaCard({ title, location, price, image, dayBadge, stateBadge }: PoojaCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="group overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-text-primary/10">
      <div className="relative aspect-16/10 w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="space-y-2">
           <h3 className="text-xl font-bold leading-snug text-text-primary">{title}</h3>
           <p className="flex items-start gap-2 text-base leading-6 text-text-primary/75">
             <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
             <span className="line-clamp-2">{location}</span>
           </p>
           <p className="flex items-center gap-2 text-base font-semibold text-text-primary/80">
             <CalendarDays className="h-5 w-5 shrink-0 text-saffron" />
             {t.card.every} {dayBadge} {t.card.in} {stateBadge}
           </p>
        </div>
        
        <div className="flex items-center justify-between mt-1">
           <div className="text-saffron font-bold text-xl">{price}</div>
           <Button variant="gradient" className="h-12 w-fit rounded-full px-6 text-base font-bold shadow-md transition-all hover:shadow-lg">
              {t.card.bookNow}
              <ArrowRight className="ml-1 h-4 w-4" />
           </Button>
        </div>

        <div className="border-t border-gray-100 pt-3 flex items-center gap-1.5 mt-2">
           <Info className="h-4 w-4 shrink-0 text-red-600" />
           <span className="text-sm font-semibold text-red-600">{t.card.subscription}</span>
        </div>
      </CardContent>
    </Card>
  );
}
