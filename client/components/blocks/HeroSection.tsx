"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BANNER_IMAGES } from "@/constants/hero-section.const";
import { SECTION_ROUTES } from "@/constants/route.const";
import { cn } from "@/lib/utils";
import type { Language } from "@/translations/locales";

type HeroBannerCopy = {
  trusted: string;
  line1: string;
  line2: string;
  description: string;
  authentic: string;
  temples: string;
  secure: string;
};

const HERO_BANNER_COPY: Record<Language, HeroBannerCopy[]> = {
  en: [
    {
      trusted: "Devotion brought closer to your home",
      line1: "Bring devotion home.",
      line2: "Begin every prayer with",
      description:
        "Book sacred poojas from home and stay connected through temple updates, prasad, and blessings offered in your name.",
      authentic: "Poojas offered for your family",
      temples: "Blessings connected to your home",
      secure: "Prasad and updates delivered with care",
    },
    {
      trusted: "Authentic rituals by Vedic pandits",
      line1: "Vedic rituals,",
      line2: "performed with devotion",
      description:
        "Join authentic rituals performed by trusted Vedic pandits with your name, gotra, and sankalpa included.",
      authentic: "Qualified Vedic pandits",
      temples: "Traditional mantras and sankalpa",
      secure: "Clear updates for every booking",
    },
    {
      trusted: "Sacred temples across India",
      line1: "Pray at sacred temples,",
      line2: "wherever you are with",
      description:
        "Discover revered temples across India and book poojas connected to ancient traditions, deities, and sacred places.",
      authentic: "Renowned temple rituals",
      temples: "Sacred temples across India",
      secure: "Temple-linked pooja updates",
    },
    {
      trusted: "Trusted and secure booking",
      line1: "Book your pooja",
      line2: "simply and securely with",
      description:
        "Choose a pooja, add devotee details, complete your booking, and receive updates from ritual to prasad delivery.",
      authentic: "Simple pooja booking",
      temples: "Photo and video updates",
      secure: "Trusted and secure payment",
    },
  ],
  ml: [
    {
      trusted: "ഭക്തി വീട്ടിനടുത്തേക്ക്",
      line1: "ഭക്തി വീട്ടിലെത്തിക്കൂ.",
      line2: "ഓരോ പ്രാർത്ഥനയും തുടങ്ങൂ",
      description:
        "വീട്ടിൽ നിന്ന് പൂജകൾ ബുക്ക് ചെയ്ത് ക്ഷേത്ര അപ്ഡേറ്റുകൾ, പ്രസാദം, നിങ്ങളുടെ പേരിലെ അനുഗ്രഹങ്ങൾ എന്നിവ നേടൂ.",
      authentic: "കുടുംബത്തിനായി പൂജ",
      temples: "വീട്ടിലെത്തുന്ന അനുഗ്രഹങ്ങൾ",
      secure: "പ്രസാദവും അപ്ഡേറ്റുകളും",
    },
    {
      trusted: "വേദപണ്ഡിതരുടെ ആധികാരിക പൂജ",
      line1: "വേദ പൂജകൾ,",
      line2: "ഭക്തിയോടെ നടത്തുന്ന",
      description:
        "വിശ്വസനീയ വേദപണ്ഡിതർ പേര്, ഗോത്രം, സങ്കൽപം എന്നിവ ചേർത്ത് നടത്തുന്ന ആധികാരിക പൂജകളിൽ പങ്കെടുക്കൂ.",
      authentic: "യോഗ്യ വേദപണ്ഡിതർ",
      temples: "മന്ത്രങ്ങളും സങ്കൽപവും",
      secure: "വ്യക്തമായ അപ്ഡേറ്റുകൾ",
    },
    {
      trusted: "ഇന്ത്യയിലെ പുണ്യക്ഷേത്രങ്ങൾ",
      line1: "പുണ്യക്ഷേത്രങ്ങളിൽ പ്രാർത്ഥിക്കൂ,",
      line2: "നിങ്ങൾ എവിടെയായാലും",
      description:
        "ഇന്ത്യയിലെ പ്രസിദ്ധ ക്ഷേത്രങ്ങളുടെയും പുണ്യപരമ്പരകളുടെയും അനുബന്ധമായ പൂജകൾ എളുപ്പത്തിൽ ബുക്ക് ചെയ്യൂ.",
      authentic: "ക്ഷേത്ര പൂജകൾ",
      temples: "ഇന്ത്യയിലെ പുണ്യക്ഷേത്രങ്ങൾ",
      secure: "ക്ഷേത്ര അപ്ഡേറ്റുകൾ",
    },
    {
      trusted: "സുരക്ഷിതവും വിശ്വസനീയവുമായ ബുക്കിംഗ്",
      line1: "പൂജ ബുക്ക് ചെയ്യൂ",
      line2: "ലളിതവും സുരക്ഷിതവുമായി",
      description:
        "പൂജ തിരഞ്ഞെടുക്കുക, ഭക്തരുടെ വിവരം ചേർക്കുക, ബുക്കിംഗ് പൂർത്തിയാക്കി പൂജ മുതൽ പ്രസാദം വരെ അപ്ഡേറ്റുകൾ നേടൂ.",
      authentic: "ലളിത ബുക്കിംഗ്",
      temples: "ഫോട്ടോ, വീഡിയോ അപ്ഡേറ്റുകൾ",
      secure: "സുരക്ഷിത പേയ്മെന്റ്",
    },
  ],
  hi: [
    {
      trusted: "भक्ति आपके घर के करीब",
      line1: "भक्ति घर लाएँ।",
      line2: "हर प्रार्थना शुरू करें",
      description:
        "घर बैठे पवित्र पूजा बुक करें और मंदिर अपडेट, प्रसाद व आपके नाम से अर्पित आशीर्वाद से जुड़े रहें।",
      authentic: "परिवार के नाम से पूजा",
      temples: "घर तक पहुँचते आशीर्वाद",
      secure: "प्रसाद और अपडेट सावधानी से",
    },
    {
      trusted: "वैदिक पंडितों द्वारा प्रामाणिक अनुष्ठान",
      line1: "वैदिक अनुष्ठान,",
      line2: "श्रद्धा से सम्पन्न",
      description:
        "विश्वसनीय वैदिक पंडितों द्वारा आपके नाम, गोत्र और संकल्प सहित होने वाली प्रामाणिक पूजा में शामिल हों।",
      authentic: "योग्य वैदिक पंडित",
      temples: "मंत्र और संकल्प",
      secure: "हर बुकिंग पर अपडेट",
    },
    {
      trusted: "भारत के पवित्र मंदिर",
      line1: "पवित्र मंदिरों में प्रार्थना,",
      line2: "आप जहाँ भी हों",
      description:
        "भारत के प्रसिद्ध मंदिरों, देवताओं और पवित्र परंपराओं से जुड़ी पूजा आसानी से बुक करें।",
      authentic: "प्रसिद्ध मंदिर पूजा",
      temples: "भारत भर के मंदिर",
      secure: "मंदिर पूजा अपडेट",
    },
    {
      trusted: "विश्वसनीय और सुरक्षित बुकिंग",
      line1: "अपनी पूजा बुक करें",
      line2: "सरल और सुरक्षित",
      description:
        "पूजा चुनें, भक्त विवरण जोड़ें, बुकिंग पूरी करें और अनुष्ठान से प्रसाद तक हर अपडेट पाएँ।",
      authentic: "सरल पूजा बुकिंग",
      temples: "फोटो और वीडियो अपडेट",
      secure: "सुरक्षित भुगतान",
    },
  ],
  mr: [
    {
      trusted: "भक्ती आपल्या घराजवळ",
      line1: "भक्ती घरी आणा.",
      line2: "प्रत्येक प्रार्थना सुरू करा",
      description:
        "घरबसल्या पवित्र पूजा बुक करा आणि मंदिर अपडेट्स, प्रसाद व आपल्या नावाने अर्पण झालेले आशीर्वाद मिळवा.",
      authentic: "कुटुंबाच्या नावाने पूजा",
      temples: "घरी पोहोचणारे आशीर्वाद",
      secure: "प्रसाद आणि अपडेट्स",
    },
    {
      trusted: "वैदिक पंडितांकडून प्रामाणिक विधी",
      line1: "वैदिक विधी,",
      line2: "श्रद्धेने संपन्न",
      description:
        "विश्वसनीय वैदिक पंडितांकडून आपल्या नाव, गोत्र आणि संकल्पासह होणाऱ्या प्रामाणिक पूजेत सहभागी व्हा.",
      authentic: "पात्र वैदिक पंडित",
      temples: "मंत्र आणि संकल्प",
      secure: "प्रत्येक बुकिंगचे अपडेट्स",
    },
    {
      trusted: "भारतभरातील पवित्र मंदिरे",
      line1: "पवित्र मंदिरांत प्रार्थना,",
      line2: "आपण कुठेही असाल",
      description:
        "भारतभरातील प्रसिद्ध मंदिरे, देवता आणि पवित्र परंपरांशी जोडलेल्या पूजा सहज बुक करा.",
      authentic: "प्रसिद्ध मंदिर पूजा",
      temples: "भारतभरातील मंदिरे",
      secure: "मंदिर पूजा अपडेट्स",
    },
    {
      trusted: "विश्वासार्ह आणि सुरक्षित बुकिंग",
      line1: "आपली पूजा बुक करा",
      line2: "सोप्या आणि सुरक्षित पद्धतीने",
      description:
        "पूजा निवडा, भक्तांची माहिती जोडा, बुकिंग पूर्ण करा आणि विधीपासून प्रसादापर्यंत अपडेट्स मिळवा.",
      authentic: "सोपे पूजा बुकिंग",
      temples: "फोटो व व्हिडिओ अपडेट्स",
      secure: "सुरक्षित पेमेंट",
    },
  ],
  ta: [
    {
      trusted: "பக்தி உங்கள் வீட்டிற்கு அருகில்",
      line1: "பக்தியை வீட்டிற்கு கொண்டு வாருங்கள்.",
      line2: "ஒவ்வொரு பிரார்த்தனையும் தொடங்குங்கள்",
      description:
        "வீட்டிலிருந்தே புனித பூஜைகளை பதிவு செய்து, கோவில் அப்டேட்கள், பிரசாதம் மற்றும் உங்கள் பெயரில் ஆசீர்வாதங்களைப் பெறுங்கள்.",
      authentic: "குடும்பத்திற்கான பூஜை",
      temples: "வீட்டுடன் இணையும் ஆசீர்வாதம்",
      secure: "பிரசாதம் மற்றும் அப்டேட்கள்",
    },
    {
      trusted: "வேத பண்டிதர்களின் உண்மையான சடங்குகள்",
      line1: "வேத சடங்குகள்,",
      line2: "பக்தியுடன் நடத்தப்படும்",
      description:
        "நம்பகமான வேத பண்டிதர்கள் உங்கள் பெயர், கோத்திரம், சங்கல்பம் சேர்த்து நடத்தும் உண்மையான பூஜையில் கலந்து கொள்ளுங்கள்.",
      authentic: "தகுதியான வேத பண்டிதர்கள்",
      temples: "மந்திரங்கள் மற்றும் சங்கல்பம்",
      secure: "ஒவ்வொரு பதிவுக்கும் அப்டேட்கள்",
    },
    {
      trusted: "இந்தியாவின் புனித கோவில்கள்",
      line1: "புனித கோவில்களில் பிரார்த்தனை,",
      line2: "நீங்கள் எங்கிருந்தாலும்",
      description:
        "இந்தியாவின் புகழ்பெற்ற கோவில்கள், தெய்வங்கள் மற்றும் புனித மரபுகளுடன் இணைந்த பூஜைகளை எளிதாக பதிவு செய்யுங்கள்.",
      authentic: "புகழ்பெற்ற கோவில் பூஜை",
      temples: "இந்தியா முழுவதும் கோவில்கள்",
      secure: "கோவில் பூஜை அப்டேட்கள்",
    },
    {
      trusted: "நம்பகமான பாதுகாப்பான பதிவு",
      line1: "உங்கள் பூஜையை பதிவு செய்யுங்கள்",
      line2: "எளிதாகவும் பாதுகாப்பாகவும்",
      description:
        "பூஜையைத் தேர்வு செய்து, பக்தர் விவரங்களைச் சேர்த்து, பதிவை முடித்து, சடங்கிலிருந்து பிரசாதம் வரை அப்டேட்களைப் பெறுங்கள்.",
      authentic: "எளிய பூஜை பதிவு",
      temples: "புகைப்பட, வீடியோ அப்டேட்கள்",
      secure: "பாதுகாப்பான கட்டணம்",
    },
  ],
};

export function HeroSection() {
  const { language, t } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const activeCopy =
    HERO_BANNER_COPY[language][activeImage] ?? HERO_BANNER_COPY.en[activeImage];
  const isMalayalam = language === "ml";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % BANNER_IMAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-[#1D1107] md:min-h-[100svh] lg:min-h-[100svh]">
      <div className="absolute inset-0 h-full w-full">
        {BANNER_IMAGES.map((image, index) => (
          <div
            key={image.src}
            role="img"
            aria-label={image.alt}
            style={{ backgroundImage: `url(${image.src})` }}
            className={`absolute inset-0 bg-cover bg-fixed bg-position-[62%_center] bg-no-repeat transition-opacity duration-700 ease-in-out md:bg-center ${
              index === activeImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/55 to-black/5" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 w-full px-4 pb-32 pt-18 text-white sm:px-5 sm:pb-28 sm:pt-22 md:px-7 md:pb-24 md:pt-24 lg:px-16 lg:pb-20">
        <div key={`${language}-${activeImage}`} className="hero-copy-transition max-w-3xl">
          <p
            className={cn(
              "mb-2 flex min-h-8 items-start gap-2 text-xs font-bold tracking-wide text-white/60 sm:mb-3 sm:min-h-7 sm:text-sm md:text-base",
              isMalayalam && "text-[11px] sm:text-xs md:text-sm",
            )}
          >
            <BadgeCheck className="h-4 w-4 shrink-0 text-saffron sm:h-5 sm:w-5" />
            <span className="min-w-0 text-wrap-safe">{activeCopy.trusted}</span>
          </p>
          <h1
            className={cn(
              "mb-4 min-h-30 max-w-3xl text-[1.78rem] font-extrabold leading-[1.12] sm:min-h-38 sm:text-[2.35rem] md:min-h-44 md:text-[2.9rem] lg:min-h-50 lg:text-[3.45rem] xl:text-[3.75rem]",
              isMalayalam &&
                "text-[1.38rem] leading-[1.2] sm:text-[1.82rem] md:text-[2.25rem] lg:text-[2.8rem] xl:text-[3.05rem]",
            )}
          >
            <span className="block text-wrap-safe">{activeCopy.line1}</span>
            <span className="mt-1.5 block text-wrap-safe text-white/85">
              {activeCopy.line2}
            </span>
            <span className="yaagam-glow mt-1.5 block w-fit text-saffron">
              YAAGAM
            </span>
          </h1>

          <p
            className={cn(
              "mb-4 min-h-18 max-w-xl text-wrap-safe text-xs leading-5 text-white/65 sm:mb-5 sm:min-h-16 sm:text-sm sm:leading-6 md:max-w-2xl md:text-base md:leading-7 lg:text-lg",
              isMalayalam &&
                "text-[11px] leading-5 sm:text-xs md:text-sm md:leading-6 lg:text-base",
            )}
          >
            {activeCopy.description}
          </p>

          <a href={SECTION_ROUTES.upcomingPoojas}>
            <Button variant="default" className="mb-5 h-auto min-h-10 whitespace-normal rounded-full bg-saffron px-5 py-2.5 text-center text-sm font-bold leading-5 text-white shadow-lg shadow-black/20 hover:bg-[#c96c1a] sm:mb-6 sm:min-h-11 sm:px-6 md:mb-7 md:min-h-12 md:px-7 md:py-3 md:text-base">
              <span className="text-wrap-safe">{t.hero.explore}</span>
              <ArrowRight className="motion-arrow-right h-4 w-4" />
            </Button>
          </a>

          <div className="grid max-w-3xl grid-cols-3 gap-1.5 border-t border-white/15 pt-4 text-white/65 sm:gap-3 sm:pt-5">
            <div className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
              <BadgeCheck className="h-4 w-4 shrink-0 text-saffron sm:mt-0.5 sm:h-5 sm:w-5" />
              <span
                className={cn(
                  "min-w-0 text-wrap-safe text-[10.5px] leading-3.5 sm:text-sm sm:leading-5",
                  isMalayalam && "text-[9.5px] leading-3 sm:text-xs sm:leading-4",
                )}
              >
                {activeCopy.authentic}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
              <MapPin className="h-4 w-4 shrink-0 text-saffron sm:mt-0.5 sm:h-5 sm:w-5" />
              <span
                className={cn(
                  "min-w-0 text-wrap-safe text-[10.5px] leading-3.5 sm:text-sm sm:leading-5",
                  isMalayalam && "text-[9.5px] leading-3 sm:text-xs sm:leading-4",
                )}
              >
                {activeCopy.temples}
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
              <ShieldCheck className="h-4 w-4 shrink-0 text-saffron sm:mt-0.5 sm:h-5 sm:w-5" />
              <span
                className={cn(
                  "min-w-0 text-wrap-safe text-[10.5px] leading-3.5 sm:text-sm sm:leading-5",
                  isMalayalam && "text-[9.5px] leading-3 sm:text-xs sm:leading-4",
                )}
              >
                {activeCopy.secure}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-7"
        aria-label={t.hero.selectBanner}
      >
        {BANNER_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveImage(index)}
            aria-label={`${t.hero.showBanner} ${index + 1}`}
            aria-current={index === activeImage ? "true" : undefined}
            className="group flex h-10 w-9 items-center justify-center"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 group-hover:bg-saffron ${
                index === activeImage
                  ? "w-7 bg-saffron shadow-[0_0_10px_rgba(230,126,34,0.8)]"
                  : "w-4 bg-white/55"
              }`}
            />
          </button>
        ))}
      </div>
      <style>{`
        @keyframes hero-copy-in {
          from {
            opacity: 0;
            filter: blur(3px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        .hero-copy-transition {
          animation: hero-copy-in 650ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-copy-transition {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}