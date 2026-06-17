"use client";

import { HeroSection } from "@/components/blocks/HeroSection";
import { PoojaCard } from "@/components/blocks/PoojaCard";
import { TestimonialCard } from "@/components/blocks/TestimonialCard";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Landmark,
  PackageCheck,
  Play,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const POOJAS = [
  {
    title: "Chandra (Soman) Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/chandra_graha.png",
    dayBadge: "Monday",
    stateBadge: "Kerala",
  },
  {
    title: "Kooja (Chovva) Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/kuja_graha.png",
    dayBadge: "Tuesday",
    stateBadge: "Kerala",
  },
  {
    title: "Guru Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/guru_graha.png",
    dayBadge: "Thursday",
    stateBadge: "Kerala",
  },
  {
    title: "Budha Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/budha_graha.png",
    dayBadge: "Wednesday",
    stateBadge: "Kerala",
  },
  {
    title: "Shukra Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/shukra_graha.png",
    dayBadge: "Friday",
    stateBadge: "Kerala",
  },
  {
    title: "Nava Graha Pooja - Raahu & Kethu",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "â‚¹500",
    image: "/nava_graha.png",
    dayBadge: "Sunday",
    stateBadge: "Kerala",
  },
];

const GUIDE_ICONS = [CalendarDays, Sparkles, BookOpenText, Landmark];

const TESTIMONIALS = [
  {
    name: "Paresh Nikita",
    location: "Mumbai, Maharashtra",
    rating: 5,
    review: "Very well organised. We could participate in the pooja easily from home and received every update on time.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Nanda Mittra",
    location: "Lucknow, Uttar Pradesh",
    rating: 5,
    review: "The pooja was offered in my name and gotra. The process was simple, clear, and deeply satisfying.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "B Sivaraman",
    location: "Hyderabad, Telangana",
    rating: 5,
    review: "Excellent service and a very peaceful experience. The updates made us feel part of the ceremony.",
    image: "https://randomuser.me/api/portraits/men/68.jpg",
  },
  {
    name: "Sharmela Yalisetty",
    location: "Hyderabad, Telangana",
    rating: 5,
    review: "A genuine service with timely communication. Receiving the prasad at home was very special.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex w-full flex-col pb-16">
      <HeroSection />

      <section aria-label={t.home.trustLabel} className="border-b border-saffron/20 bg-white">
        <div className="container mx-auto grid gap-6 px-4 py-7 sm:grid-cols-3 md:px-8">
          <div className="flex items-start gap-3">
            <Users className="h-7 w-7 shrink-0 text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.devotees}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.devoteesSub}</span></div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-7 w-7 shrink-0 fill-saffron text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.rating}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.ratingSub}</span></div>
          </div>
          <div className="flex items-start gap-3">
            <PackageCheck className="h-7 w-7 shrink-0 text-saffron" />
            <div className="min-w-0"><strong className="block text-wrap-safe text-lg leading-6 text-text-primary">{t.home.prasad}</strong><span className="text-wrap-safe text-sm leading-5 text-text-primary/70">{t.home.prasadSub}</span></div>
          </div>
        </div>
      </section>

      <section id="upcoming-poojas" className="container mx-auto mt-20 px-4 md:mt-28 md:px-8">
        <div className="mb-9 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.upcomingEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.upcomingTitle}</h2>
            <p className="mt-3 max-w-2xl text-wrap-safe text-base leading-7 text-text-primary/70 sm:text-lg">{t.home.upcomingDescription}</p>
          </div>
          <button className="hidden h-12 shrink-0 items-center gap-2 text-base font-bold text-saffron hover:underline sm:flex">
            {t.home.viewAll} <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {POOJAS.map((pooja) => <PoojaCard key={pooja.title} {...pooja} />)}
        </div>
      </section>

      <section id="how-it-works" className="mt-24 bg-[#fff8f2] py-20 md:mt-32">
        <div className="container mx-auto grid items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.bookingEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.bookingTitle}</h2>
            <div className="mt-10 space-y-8">
              {t.home.bookingSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4 sm:gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron text-lg font-extrabold text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <h3 className="text-wrap-safe text-xl font-bold leading-7 text-text-primary">{step.title}</h3>
                    <p className="mt-1 text-wrap-safe text-base leading-7 text-text-primary/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-xl">
            <Image src="https://images.unsplash.com/photo-1604085572504-a392ddf0d86a" alt={t.home.ceremonyAlt} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/25" />
            <button aria-label={t.home.playGuide} className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-saffron shadow-xl transition-transform hover:scale-105">
              <Play className="ml-1 h-7 w-7 fill-saffron" />
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.guideEyebrow}</p>
          <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.guideTitle}</h2>
          <p className="mt-3 text-wrap-safe text-base leading-7 text-text-primary/70 sm:text-lg">{t.home.guideDescription}</p>
        </div>
        <div className="mt-12 grid border-y border-black/10 md:grid-cols-2">
          {t.home.guides.map((guide, index) => {
            const Icon = GUIDE_ICONS[index];
            return (
              <article key={guide.title} className={`py-8 md:p-9 ${index < 3 ? "border-b border-black/10" : ""} ${index === 2 ? "md:border-b-0" : ""} ${index % 2 === 0 ? "md:border-r md:border-black/10" : ""}`}>
                <Icon className="h-9 w-9 text-saffron" />
                <h3 className="mt-5 text-wrap-safe text-2xl font-bold leading-8 text-text-primary">{guide.title}</h3>
                <p className="mt-2 max-w-md text-wrap-safe text-base leading-7 text-text-primary/70">{guide.description}</p>
                <button className="mt-5 inline-flex min-h-11 items-start gap-2 py-2 text-left text-base font-bold leading-5 text-saffron hover:underline"><span className="min-w-0 text-wrap-safe">{guide.action}</span><ArrowRight className="mt-0.5 h-5 w-5 shrink-0" /></button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-wrap-safe text-base font-bold text-saffron">{t.home.testimonialsEyebrow}</p>
            <h2 className="text-wrap-safe text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">{t.home.testimonialsTitle}</h2>
            <p className="mx-auto mt-3 flex max-w-3xl items-start justify-center gap-2 text-base leading-7 text-text-primary/75 sm:text-lg"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-saffron" /><span className="min-w-0 text-wrap-safe">{t.home.testimonialsRating}</span></p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((testimonial) => <TestimonialCard key={testimonial.name} {...testimonial} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
