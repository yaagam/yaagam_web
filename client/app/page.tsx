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

const POOJAS = [
  {
    title: "Chandra (Soman) Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/chandra_graha.png",
    dayBadge: "Monday",
    stateBadge: "Kerala",
  },
  {
    title: "Kooja (Chovva) Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/kuja_graha.png",
    dayBadge: "Tuesday",
    stateBadge: "Kerala",
  },
  {
    title: "Guru Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/guru_graha.png",
    dayBadge: "Thursday",
    stateBadge: "Kerala",
  },
  {
    title: "Budha Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/budha_graha.png",
    dayBadge: "Wednesday",
    stateBadge: "Kerala",
  },
  {
    title: "Shukra Graha Pooja",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/shukra_graha.png",
    dayBadge: "Friday",
    stateBadge: "Kerala",
  },
  {
    title: "Nava Graha Pooja - Raahu & Kethu",
    location: "Kottayil Kovilakam Sree Krishna Swami Temple, Kerala",
    price: "₹500",
    image: "/nava_graha.png",
    dayBadge: "Sunday",
    stateBadge: "Kerala",
  },
];

const BOOKING_STEPS = [
  {
    title: "Share your details",
    description: "Add the names and gotra of family members joining the pooja.",
  },
  {
    title: "The temple performs your pooja",
    description: "Trusted Vedic pandits perform the ritual in your name.",
  },
  {
    title: "Receive photo and video updates",
    description: "Follow your pooja through clear updates sent to you.",
  },
  {
    title: "Prasad reaches your home",
    description: "Sacred prasad is packed carefully and delivered to your address.",
  },
];

const SPIRITUAL_GUIDES = [
  {
    title: "Daily Panchang",
    description: "Plan important moments with simple daily Panchang guidance.",
    action: "View Panchang",
    icon: CalendarDays,
  },
  {
    title: "Pooja and Sevas",
    description: "Find the right temple ritual for health, peace, and prosperity.",
    action: "Explore Poojas",
    icon: Sparkles,
  },
  {
    title: "Dharmik Knowledge",
    description: "Understand mantras, festivals, rituals, and sacred traditions.",
    action: "Start Reading",
    icon: BookOpenText,
  },
  {
    title: "Temples of India",
    description: "Discover sacred temples, their stories, and special offerings.",
    action: "Explore Temples",
    icon: Landmark,
  },
];

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
  return (
    <div className="flex w-full flex-col pb-16">
      <HeroSection />

      <section aria-label="Why devotees trust Yaagam" className="border-b border-saffron/20 bg-white">
        <div className="container mx-auto grid gap-6 px-4 py-7 sm:grid-cols-3 md:px-8">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 shrink-0 text-saffron" />
            <div><strong className="block text-lg text-text-primary">10,000+ devotees</strong><span className="text-sm text-text-primary/70">Supported across India</span></div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="h-7 w-7 shrink-0 fill-saffron text-saffron" />
            <div><strong className="block text-lg text-text-primary">4.8 devotee rating</strong><span className="text-sm text-text-primary/70">Trusted service and updates</span></div>
          </div>
          <div className="flex items-center gap-3">
            <PackageCheck className="h-7 w-7 shrink-0 text-saffron" />
            <div><strong className="block text-lg text-text-primary">Authentic prasad</strong><span className="text-sm text-text-primary/70">Delivered from the temple</span></div>
          </div>
        </div>
      </section>

      <section id="upcoming-poojas" className="container mx-auto mt-20 px-4 md:mt-28 md:px-8">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-base font-bold text-saffron">Upcoming sacred rituals</p>
            <h2 className="text-3xl font-extrabold text-text-primary md:text-4xl">Popular poojas on Yaagam</h2>
            <p className="mt-3 max-w-2xl text-lg text-text-primary/70">Choose a pooja, add your family details, and participate from wherever you are.</p>
          </div>
          <button className="hidden h-12 shrink-0 items-center gap-2 text-base font-bold text-saffron hover:underline sm:flex">
            View all poojas <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {POOJAS.map((pooja) => <PoojaCard key={pooja.title} {...pooja} />)}
        </div>
      </section>

      <section id="how-it-works" className="mt-24 bg-[#fff8f2] py-20 md:mt-32">
        <div className="container mx-auto grid items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-base font-bold text-saffron">Easy from start to finish</p>
            <h2 className="text-3xl font-extrabold text-text-primary md:text-4xl">How to book a pooja with Yaagam</h2>
            <div className="mt-10 space-y-8">
              {BOOKING_STEPS.map((step, index) => (
                <div key={step.title} className="flex gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron text-lg font-extrabold text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{step.title}</h3>
                    <p className="mt-1 text-base leading-7 text-text-primary/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-xl">
            <Image src="https://images.unsplash.com/photo-1604085572504-a392ddf0d86a" alt="A sacred temple pooja ceremony" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/25" />
            <button aria-label="Play guide to booking a pooja" className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-saffron shadow-xl transition-transform hover:scale-105">
              <Play className="ml-1 h-7 w-7 fill-saffron" />
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-2 text-base font-bold text-saffron">Your spiritual companion</p>
          <h2 className="text-3xl font-extrabold text-text-primary md:text-4xl">A simple guide through your dharmik journey</h2>
          <p className="mt-3 text-lg text-text-primary/70">Explore practical guidance, sacred traditions, and temple services in one trusted place.</p>
        </div>
        <div className="mt-12 grid border-y border-black/10 md:grid-cols-2">
          {SPIRITUAL_GUIDES.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <article key={guide.title} className={`py-8 md:p-9 ${index < 3 ? "border-b border-black/10" : ""} ${index === 2 ? "md:border-b-0" : ""} ${index % 2 === 0 ? "md:border-r md:border-black/10" : ""}`}>
                <Icon className="h-9 w-9 text-saffron" />
                <h3 className="mt-5 text-2xl font-bold text-text-primary">{guide.title}</h3>
                <p className="mt-2 max-w-md text-base leading-7 text-text-primary/70">{guide.description}</p>
                <button className="mt-5 inline-flex h-11 items-center gap-2 text-base font-bold text-saffron hover:underline">{guide.action}<ArrowRight className="h-5 w-5" /></button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-base font-bold text-saffron">Real devotee experiences</p>
            <h2 className="text-3xl font-extrabold text-text-primary md:text-4xl">What devotees say about Yaagam</h2>
            <p className="mt-3 flex items-center justify-center gap-2 text-lg text-text-primary/75"><CheckCircle2 className="h-5 w-5 text-saffron" />9 out of 10 devotees rate Yaagam 5 stars</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((testimonial) => <TestimonialCard key={testimonial.name} {...testimonial} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
