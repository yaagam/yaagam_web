"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gift,
  Home,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";
import type { Benifit, BenifitTranslation } from "@/lib/api/admin/benifit/benifits.api";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import type { Language } from "@/lib/i18n/translations";
import { getErrorMessage } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

type DbLanguage = PoojaTranslation["language"];

type PoojaDetailsViewProps = {
  poojaId: string;
};


type DetailCopy = {
  loading: string; loadErrorTitle: string; notFound: string; viewAllPoojas: string; breadcrumbPooja: string; selectPlan: string; aboutPrefix: string; aboutHighlight: string; defaultPoojaTitle: string; defaultPoojaAbout: string; defaultTemple: string; benefitAlt: string; plansTitle: string; weeklyPlan: string; singlePlan: string; bestValue: string; mostChosen: string; weeklyFeatures: string[]; singleFeatures: string[]; bookNow: string; whyPrefix: string; whyHighlight: string; whySuffix: string; packagePrefix: string; packageHighlight: string; packageSubtitle: string; packageIncludes: Array<{ title: string; description: string }>; promiseTitle: string; promiseText: string; promiseBadges: string[]; workflowPrefix: string; workflowHighlight: string; workflowSuffix: string; workflowSubtitle: string; workflowSteps: Array<{ title: string; description: string }>; faqTitle: string; faqBenefitsQuestion: (title: string) => string; faqBenefitsAnswer: (title: string, benefit: string) => string; faqMantraQuestion: string; faqMantraAnswer: string; faqParticipateQuestion: string; faqParticipateAnswer: string; faqPrasadQuestion: string; faqPrasadAnswer: string; spiritualWellBeing: string;
};

const makeDetailCopy = (copy: DetailCopy) => copy;

const enDetailCopy = makeDetailCopy({
    loading: "Loading pooja details", loadErrorTitle: "Could not load pooja", notFound: "Pooja not found.", viewAllPoojas: "View all poojas", breadcrumbPooja: "Pooja", selectPlan: "Select Pooja Plan", aboutPrefix: "About this", aboutHighlight: "Pooja", defaultPoojaTitle: "Pooja", defaultPoojaAbout: "Temple pooja performed with devotion.", defaultTemple: "Temple", benefitAlt: "Pooja benefit", plansTitle: "Available Pooja Options", weeklyPlan: "Weekly Pooja Plan", singlePlan: "Single Day Pooja", bestValue: "Best Value", mostChosen: "Most Chosen", weeklyFeatures: ["You can cancel weekly plan any time", "Full puja video shared with you", "Live updates via WhatsApp", "Blessed Prasad delivered to your home in every week"], singleFeatures: ["Single Day Pooja", "Full puja video shared with you", "Live updates via WhatsApp", "Blessed Prasad delivered to your home"], bookNow: "Book Now", whyPrefix: "Why Perform This", whyHighlight: "Pooja", whySuffix: "?", packagePrefix: "Our Pooja", packageHighlight: "Package Includes", packageSubtitle: "Here is what you get with every booking", packageIncludes: [{ title: "Puja Performed at Temple", description: "An experienced pandit performs the puja following proper Vedic rituals at the temple." }, { title: "Authentic Prasad Box", description: "Prasad prepared at the temple will be packed and delivered to your home." }, { title: "Live WhatsApp Updates", description: "Get updates on WhatsApp for all important steps of your puja." }, { title: "Personalised Puja Video", description: "Full video of your puja with sankalp, chanting, and a WhatsApp link." }], promiseTitle: "Our Promise", promiseText: "If pooja is not performed, or video is not delivered, we assure you a 100% refund.", promiseBadges: ["100% Refund", "Guaranteed Video", "No Questions Asked"], workflowPrefix: "How", workflowHighlight: "Participation in Pooja", workflowSuffix: "Works", workflowSubtitle: "Here is our pooja workflow", workflowSteps: [{ title: "Select Pooja Plan", description: "You are selected a pooja plan" }, { title: "Booked", description: "Your pooja is booked successfully." }, { title: "Scheduled", description: "Pooja is scheduled for the upcoming pooja day." }, { title: "Processing", description: "Pooja is in progress. Please wait for updates." }, { title: "Completed", description: "Photos and videos are sent on WhatsApp." }], faqTitle: "Frequently Asked Questions", faqBenefitsQuestion: (title) => `What are the benefits of ${title}?`, faqBenefitsAnswer: (title, benefit) => `${title} is performed for ${benefit.toLowerCase()} and for receiving divine blessings with devotion.`, faqMantraQuestion: "Which mantra is powerful for this pooja?", faqMantraAnswer: "The pandit uses the appropriate Vedic mantras and sankalp based on the pooja and temple tradition.", faqParticipateQuestion: "Can I participate from home?", faqParticipateAnswer: "Yes. The pooja is performed at the temple on your behalf, and updates are shared through WhatsApp.", faqPrasadQuestion: "Will I receive prasad?", faqPrasadAnswer: "Yes. Prasad is packed after the ceremony and delivered to your home where service is available.", spiritualWellBeing: "spiritual well-being",
});

const detailCopy: Record<Language, DetailCopy> = {
  en: enDetailCopy,
  ml: { ...enDetailCopy, loading: "പൂജ വിശദാംശങ്ങൾ ലോഡ് ചെയ്യുന്നു", loadErrorTitle: "പൂജ ലോഡ് ചെയ്യാനായില്ല", notFound: "പൂജ കണ്ടെത്താനായില്ല.", viewAllPoojas: "എല്ലാ പൂജകളും കാണുക", breadcrumbPooja: "പൂജ", selectPlan: "പൂജ പ്ലാൻ തിരഞ്ഞെടുക്കുക", aboutPrefix: "ഈ", aboutHighlight: "പൂജയെക്കുറിച്ച്", plansTitle: "ലഭ്യമായ പൂജ ഓപ്ഷനുകൾ", weeklyPlan: "ആഴ്ചതോറുമുള്ള പൂജ പ്ലാൻ", singlePlan: "ഒറ്റ ദിവസത്തെ പൂജ", bestValue: "മികച്ച മൂല്യം", mostChosen: "കൂടുതൽ തിരഞ്ഞെടുക്കുന്നത്", weeklyFeatures: ["പ്ലാൻ ഏത് സമയത്തും റദ്ദാക്കാം", "പൂജ വീഡിയോ ലഭിക്കും", "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", "പ്രസാദം വീട്ടിലെത്തും"], singleFeatures: ["ഒറ്റ ദിവസത്തെ പൂജ", "പൂജ വീഡിയോ ലഭിക്കും", "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", "പ്രസാദം വീട്ടിലെത്തും"], bookNow: "ഇപ്പോൾ ബുക്ക് ചെയ്യുക", whyPrefix: "ഈ", whyHighlight: "പൂജ", whySuffix: " എന്തിന് ചെയ്യണം?", packagePrefix: "ഞങ്ങളുടെ പൂജ", packageHighlight: "പാക്കേജിൽ ഉൾപ്പെടുന്നത്", packageSubtitle: "ഓരോ ബുക്കിംഗിലും ലഭിക്കുന്നത് ഇവയാണ്", packageIncludes: [{ title: "ക്ഷേത്രത്തിൽ പൂജ", description: "പണ്ഡിതൻ ക്ഷേത്രത്തിൽ ശരിയായ വിധിയിൽ പൂജ നടത്തും." }, { title: "പ്രസാദ ബോക്സ്", description: "ക്ഷേത്ര പ്രസാദം പാക്ക് ചെയ്ത് വീട്ടിലെത്തിക്കും." }, { title: "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", description: "പൂജയുടെ പ്രധാന അപ്ഡേറ്റുകൾ ലഭിക്കും." }, { title: "പൂജ വീഡിയോ", description: "നിങ്ങളുടെ പൂജയുടെ വീഡിയോ ലിങ്ക് ലഭിക്കും." }], promiseTitle: "ഞങ്ങളുടെ വാഗ്ദാനം", promiseText: "പൂജയോ വീഡിയോയോ ലഭിക്കാത്ത പക്ഷം 100% റീഫണ്ട് ഉറപ്പ്.", promiseBadges: ["100% റീഫണ്ട്", "വീഡിയോ ഉറപ്പ്", "ചോദ്യങ്ങളില്ല"], workflowPrefix: "പൂജയിൽ", workflowHighlight: "പങ്കെടുക്കുന്നത്", workflowSuffix: "എങ്ങനെ പ്രവർത്തിക്കുന്നു", workflowSubtitle: "ഞങ്ങളുടെ പൂജ പ്രവാഹം ഇതാണ്", workflowSteps: [{ title: "പ്ലാൻ തിരഞ്ഞെടുക്കുക", description: "നിങ്ങൾ പൂജ പ്ലാൻ തിരഞ്ഞെടുത്തു" }, { title: "ബുക്ക് ചെയ്തു", description: "പൂജ വിജയകരമായി ബുക്ക് ചെയ്തു." }, { title: "ഷെഡ്യൂൾ ചെയ്തു", description: "പൂജ അടുത്ത ദിവസം നടത്തും." }, { title: "നടക്കുന്നു", description: "പൂജ പുരോഗമിക്കുന്നു." }, { title: "പൂർത്തിയായി", description: "ഫോട്ടോയും വീഡിയോയും അയച്ചു." }], faqTitle: "പതിവ് ചോദ്യങ്ങൾ", faqBenefitsQuestion: (title) => `${title}യുടെ ഗുണങ്ങൾ എന്തൊക്കെയാണ്?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit}യ്ക്കും ദൈവാനുഗ്രഹത്തിനുമായി നടത്തുന്നു.`, faqMantraQuestion: "ഈ പൂജയ്ക്ക് ഏത് മന്ത്രമാണ്?", faqMantraAnswer: "ക്ഷേത്രപരമ്പര അനുസരിച്ച് പണ്ഡിതൻ മന്ത്രങ്ങൾ ജപിക്കും.", faqParticipateQuestion: "വീട്ടിൽ നിന്ന് പങ്കെടുക്കാമോ?", faqParticipateAnswer: "അതെ. അപ്ഡേറ്റുകൾ വാട്ട്സ്ആപ്പിൽ ലഭിക്കും.", faqPrasadQuestion: "പ്രസാദം ലഭിക്കുമോ?", faqPrasadAnswer: "അതെ. പ്രസാദം വീട്ടിലെത്തിക്കും.", spiritualWellBeing: "ആത്മീയ ക്ഷേമം" },
  hi: { ...enDetailCopy, loading: "पूजा विवरण लोड हो रहा है", loadErrorTitle: "पूजा लोड नहीं हो सकी", notFound: "पूजा नहीं मिली.", viewAllPoojas: "सभी पूजाएं देखें", breadcrumbPooja: "पूजा", selectPlan: "पूजा प्लान चुनें", aboutPrefix: "इस", aboutHighlight: "पूजा के बारे में", plansTitle: "उपलब्ध पूजा विकल्प", weeklyPlan: "साप्ताहिक पूजा प्लान", singlePlan: "एक दिन की पूजा", bestValue: "सर्वश्रेष्ठ मूल्य", mostChosen: "सबसे अधिक चुना गया", weeklyFeatures: ["प्लान कभी भी रद्द करें", "पूजा वीडियो मिलेगा", "WhatsApp अपडेट मिलेंगे", "प्रसाद घर पहुंचेगा"], singleFeatures: ["एक दिन की पूजा", "पूजा वीडियो मिलेगा", "WhatsApp अपडेट मिलेंगे", "प्रसाद घर पहुंचेगा"], bookNow: "अभी बुक करें", whyPrefix: "यह", whyHighlight: "पूजा", whySuffix: " क्यों करें?", packagePrefix: "हमारे पूजा", packageHighlight: "पैकेज में शामिल है", packageSubtitle: "हर बुकिंग में आपको यह मिलता है", packageIncludes: [{ title: "मंदिर में पूजा", description: "पंडित मंदिर में विधिपूर्वक पूजा करेंगे." }, { title: "प्रसाद बॉक्स", description: "मंदिर का प्रसाद घर भेजा जाएगा." }, { title: "WhatsApp अपडेट", description: "पूजा के अपडेट WhatsApp पर मिलेंगे." }, { title: "पूजा वीडियो", description: "आपकी पूजा का वीडियो लिंक मिलेगा." }], promiseTitle: "हमारा वादा", promiseText: "पूजा या वीडियो न मिलने पर 100% रिफंड.", promiseBadges: ["100% रिफंड", "वीडियो गारंटी", "कोई सवाल नहीं"], workflowPrefix: "पूजा में", workflowHighlight: "भागीदारी", workflowSuffix: "कैसे होती है", workflowSubtitle: "यह हमारा पूजा वर्कफ्लो है", workflowSteps: [{ title: "प्लान चुनें", description: "आपने पूजा प्लान चुना है" }, { title: "बुक हुआ", description: "पूजा सफलतापूर्वक बुक हुई." }, { title: "शेड्यूल", description: "पूजा अगले दिन होगी." }, { title: "प्रक्रिया में", description: "पूजा चल रही है." }, { title: "पूर्ण", description: "फोटो और वीडियो भेजे गए." }], faqTitle: "अक्सर पूछे जाने वाले प्रश्न", faqBenefitsQuestion: (title) => `${title} के लाभ क्या हैं?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} और आशीर्वाद के लिए की जाती है.`, faqMantraQuestion: "कौन सा मंत्र किया जाता है?", faqMantraAnswer: "पंडित मंदिर परंपरा के अनुसार मंत्र जप करते हैं.", faqParticipateQuestion: "क्या घर से भाग ले सकते हैं?", faqParticipateAnswer: "हाँ. अपडेट WhatsApp पर मिलेंगे.", faqPrasadQuestion: "क्या प्रसाद मिलेगा?", faqPrasadAnswer: "हाँ. प्रसाद घर भेजा जाएगा.", spiritualWellBeing: "आध्यात्मिक कल्याण" },
  mr: { ...enDetailCopy, loading: "पूजेचे तपशील लोड होत आहेत", loadErrorTitle: "पूजा लोड होऊ शकली नाही", notFound: "पूजा सापडली नाही.", viewAllPoojas: "सर्व पूजा पहा", breadcrumbPooja: "पूजा", selectPlan: "पूजा प्लॅन निवडा", aboutPrefix: "या", aboutHighlight: "पूजेबद्दल", plansTitle: "उपलब्ध पूजा पर्याय", weeklyPlan: "साप्ताहिक पूजा प्लॅन", singlePlan: "एक दिवसाची पूजा", bestValue: "सर्वोत्तम मूल्य", mostChosen: "सर्वाधिक निवडलेले", weeklyFeatures: ["प्लॅन कधीही रद्द करा", "पूजा व्हिडिओ मिळेल", "WhatsApp अपडेट्स मिळतील", "प्रसाद घरी येईल"], singleFeatures: ["एक दिवसाची पूजा", "पूजा व्हिडिओ मिळेल", "WhatsApp अपडेट्स मिळतील", "प्रसाद घरी येईल"], bookNow: "आता बुक करा", whyPrefix: "ही", whyHighlight: "पूजा", whySuffix: " का करावी?", packagePrefix: "आमच्या पूजा", packageHighlight: "पॅकेजमध्ये समाविष्ट", packageSubtitle: "प्रत्येक बुकिंगमध्ये तुम्हाला हे मिळते", packageIncludes: [{ title: "मंदिरात पूजा", description: "पंडित मंदिरात विधिपूर्वक पूजा करतील." }, { title: "प्रसाद बॉक्स", description: "मंदिराचा प्रसाद घरी पाठवला जाईल." }, { title: "WhatsApp अपडेट्स", description: "पूजेचे अपडेट्स WhatsApp वर मिळतील." }, { title: "पूजा व्हिडिओ", description: "तुमच्या पूजेचा व्हिडिओ लिंक मिळेल." }], promiseTitle: "आमचे वचन", promiseText: "पूजा किंवा व्हिडिओ न मिळाल्यास 100% परतावा.", promiseBadges: ["100% परतावा", "व्हिडिओ हमी", "प्रश्न नाहीत"], workflowPrefix: "पूजेत", workflowHighlight: "सहभाग", workflowSuffix: "कसा होतो", workflowSubtitle: "हा आमचा पूजा वर्कफ्लो आहे", workflowSteps: [{ title: "प्लॅन निवडा", description: "तुम्ही पूजा प्लॅन निवडला आहे" }, { title: "बुक झाले", description: "पूजा यशस्वीरित्या बुक झाली." }, { title: "शेड्यूल", description: "पूजा पुढील दिवशी होईल." }, { title: "प्रक्रियेत", description: "पूजा सुरू आहे." }, { title: "पूर्ण", description: "फोटो आणि व्हिडिओ पाठवले." }], faqTitle: "वारंवार विचारले जाणारे प्रश्न", faqBenefitsQuestion: (title) => `${title} चे लाभ काय आहेत?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} आणि आशीर्वादासाठी केली जाते.`, faqMantraQuestion: "कोणता मंत्र केला जातो?", faqMantraAnswer: "पंडित मंदिर परंपरेनुसार मंत्र जप करतात.", faqParticipateQuestion: "घरून सहभागी होता येईल का?", faqParticipateAnswer: "हो. अपडेट्स WhatsApp वर मिळतील.", faqPrasadQuestion: "प्रसाद मिळेल का?", faqPrasadAnswer: "हो. प्रसाद घरी पाठवला जाईल.", spiritualWellBeing: "आध्यात्मिक कल्याण" },
  ta: { ...enDetailCopy, loading: "பூஜை விவரங்கள் ஏற்றப்படுகின்றன", loadErrorTitle: "பூஜையை ஏற்ற முடியவில்லை", notFound: "பூஜை கிடைக்கவில்லை.", viewAllPoojas: "அனைத்து பூஜைகளையும் பார்க்க", breadcrumbPooja: "பூஜை", selectPlan: "பூஜை திட்டத்தை தேர்ந்தெடுக்கவும்", aboutPrefix: "இந்த", aboutHighlight: "பூஜை பற்றி", plansTitle: "கிடைக்கும் பூஜை விருப்பங்கள்", weeklyPlan: "வாராந்திர பூஜை திட்டம்", singlePlan: "ஒரு நாள் பூஜை", bestValue: "சிறந்த மதிப்பு", mostChosen: "அதிகம் தேர்ந்தெடுக்கப்பட்டது", weeklyFeatures: ["திட்டத்தை எப்போது வேண்டுமானாலும் ரத்து செய்யலாம்", "பூஜை வீடியோ கிடைக்கும்", "WhatsApp புதுப்பிப்புகள் கிடைக்கும்", "பிரசாதம் வீட்டிற்கு வரும்"], singleFeatures: ["ஒரு நாள் பூஜை", "பூஜை வீடியோ கிடைக்கும்", "WhatsApp புதுப்பிப்புகள் கிடைக்கும்", "பிரசாதம் வீட்டிற்கு வரும்"], bookNow: "இப்போது பதிவு செய்யவும்", whyPrefix: "இந்த", whyHighlight: "பூஜை", whySuffix: " ஏன் செய்ய வேண்டும்?", packagePrefix: "எங்கள் பூஜை", packageHighlight: "தொகுப்பில் அடங்கும்", packageSubtitle: "ஒவ்வொரு பதிவிலும் நீங்கள் பெறுவது இதுதான்", packageIncludes: [{ title: "கோவிலில் பூஜை", description: "பண்டிதர் கோவிலில் முறையாக பூஜை செய்வார்." }, { title: "பிரசாத பெட்டி", description: "கோவில் பிரசாதம் வீட்டிற்கு அனுப்பப்படும்." }, { title: "WhatsApp புதுப்பிப்புகள்", description: "பூஜை புதுப்பிப்புகள் WhatsApp இல் கிடைக்கும்." }, { title: "பூஜை வீடியோ", description: "உங்கள் பூஜை வீடியோ இணைப்பு கிடைக்கும்." }], promiseTitle: "எங்கள் வாக்குறுதி", promiseText: "பூஜை அல்லது வீடியோ கிடைக்காவிட்டால் 100% பணம் திருப்பித் தரப்படும்.", promiseBadges: ["100% திருப்பித் தரல்", "வீடியோ உத்தரவாதம்", "கேள்விகள் இல்லை"], workflowPrefix: "பூஜையில்", workflowHighlight: "பங்கேற்பது", workflowSuffix: "எப்படி வேலை செய்கிறது", workflowSubtitle: "எங்கள் பூஜை செயல்முறை இதோ", workflowSteps: [{ title: "திட்டம் தேர்வு", description: "நீங்கள் பூஜை திட்டத்தை தேர்ந்தெடுத்துள்ளீர்கள்" }, { title: "பதிவு", description: "பூஜை வெற்றிகரமாக பதிவு செய்யப்பட்டது." }, { title: "திட்டமிடப்பட்டது", description: "பூஜை அடுத்த நாளில் நடைபெறும்." }, { title: "நடைபெறுகிறது", description: "பூஜை நடைபெறுகிறது." }, { title: "முடிந்தது", description: "புகைப்படமும் வீடியோவும் அனுப்பப்பட்டது." }], faqTitle: "அடிக்கடி கேட்கப்படும் கேள்விகள்", faqBenefitsQuestion: (title) => `${title} பலன்கள் என்ன?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} மற்றும் ஆசீர்வாதத்திற்காக செய்யப்படுகிறது.`, faqMantraQuestion: "எந்த மந்திரம் செய்யப்படும்?", faqMantraAnswer: "பண்டிதர் கோவில் மரபின்படி மந்திரம் செய்வார்.", faqParticipateQuestion: "வீட்டிலிருந்து பங்கேற்கலாமா?", faqParticipateAnswer: "ஆம். புதுப்பிப்புகள் WhatsApp இல் கிடைக்கும்.", faqPrasadQuestion: "பிரசாதம் கிடைக்குமா?", faqPrasadAnswer: "ஆம். பிரசாதம் வீட்டிற்கு அனுப்பப்படும்.", spiritualWellBeing: "ஆன்மீக நலம்" },
};

const dbLanguageByUiLanguage: Record<Language, DbLanguage> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

const packageIncludes = [
  {
    title: "Puja Performed at Temple",
    description:
      "An experienced pandit performs the puja following proper Vedic rituals at the temple.",
    icon: Home,
  },
  {
    title: "Authentic Prasad Box",
    description:
      "Prasad prepared at the temple will be packed and delivered to your home.",
    icon: Gift,
  },
  {
    title: "Live WhatsApp Updates",
    description:
      "Get updates on WhatsApp for all important steps of your puja.",
    icon: MessageCircle,
  },
  {
    title: "Personalised Puja Video",
    description:
      "Full video of your puja with sankalp, chanting, and a WhatsApp link.",
    icon: PlayCircle,
  },
];

const workflowSteps = [
  {
    title: "Select Pooja Plan",
    description: "You are selected a pooja plan",
    icon: Check,
    tone: "border-orange-200 bg-orange-50 text-saffron",
  },
  {
    title: "Booked",
    description: "Your pooja is booked successfully.",
    icon: CalendarDays,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "Scheduled",
    description: "Pooja is scheduled for the upcoming Monday.",
    icon: Clock3,
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    title: "Processing",
    description: "Pooja is in progress. Please wait for updates.",
    icon: Sparkles,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    title: "Completed",
    description: "Photos and videos are sent on WhatsApp.",
    icon: CheckCircle2,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

function getLocalizedTranslation<T extends { language: DbLanguage }>(
  translations: T[] | undefined,
  language: DbLanguage,
) {
  return (
    translations?.find((translation) => translation.language === language) ??
    translations?.find((translation) => translation.language === "EN") ??
    translations?.[0] ??
    null
  );
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDiscountedAmount(
  baseAmount: string | number,
  discount: number | null | undefined,
) {
  const amount = Number(baseAmount);

  if (Number.isNaN(amount)) return baseAmount;
  if (!discount) return amount;

  return Math.max(0, Math.round(amount - (amount * discount) / 100));
}

function getBenifitTranslation(benifit: Benifit, language: DbLanguage) {
  return getLocalizedTranslation<BenifitTranslation>(benifit.translations, language);
}

function getFaqs(title: string, benifits: string[], copy: DetailCopy) {
  const firstBenifit = benifits[0] ?? copy.spiritualWellBeing;

  return [
    {
      question: copy.faqBenefitsQuestion(title),
      answer: copy.faqBenefitsAnswer(title, firstBenifit),
    },
    {
      question: "Which mantra is powerful for this pooja?",
      answer:
        "The pandit uses the appropriate Vedic mantras and sankalp based on the pooja and temple tradition.",
    },
    {
      question: "Can I participate from home?",
      answer:
        "Yes. The pooja is performed at the temple on your behalf, and updates are shared through WhatsApp.",
    },
    {
      question: "Will I receive prasad?",
      answer:
        "Yes. Prasad is packed after the ceremony and delivered to your home where service is available.",
    },
  ];
}

export function PoojaDetailsView({ poojaId }: PoojaDetailsViewProps) {
  const { language } = useLanguage();
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedDbLanguage = dbLanguageByUiLanguage[language];
  const copy = detailCopy[language];

  useEffect(() => {
    let isActive = true;

    async function loadPooja() {
      setIsLoading(true);
      setError("");

      try {
        const nextPooja = await getPoojaDetailsApi(poojaId);

        if (isActive) setPooja(nextPooja);
      } catch (loadError: unknown) {
        if (!isActive) return;

        setError(getErrorMessage(loadError, copy.loadErrorTitle));
        setPooja(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [copy.loadErrorTitle, poojaId]);

  const details = useMemo(() => {
    if (!pooja) return null;

    const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
      pooja.translations,
      selectedDbLanguage,
    );
    const templeTranslation = getLocalizedTranslation<TempleTranslation>(
      pooja.temple?.translations,
      selectedDbLanguage,
    );
    const benifits = pooja.benefits
      .map((benifit) => ({
        id: benifit.id,
        image: benifit.imageUrl,
        translation: getBenifitTranslation(benifit, selectedDbLanguage),
      }))
      .filter((benifit) => Boolean(benifit.translation));
    const title = poojaTranslation?.name ?? copy.defaultPoojaTitle;
    const benifitNames = benifits
      .map((benifit) => benifit.translation?.name)
      .filter((benifit): benifit is string => Boolean(benifit));

    return {
      title,
      about: poojaTranslation?.about ?? copy.defaultPoojaAbout,
      templeName: templeTranslation?.name ?? copy.defaultTemple,
      templePlace: templeTranslation?.place ?? "",
      templeState: pooja.temple?.state ?? "",
      images: pooja.imageUrls?.length ? pooja.imageUrls : ["/nava_graha.png"],
      benifits,
      benifitNames,
      faqs: getFaqs(title, benifitNames, copy),
      weeklyAmount: getDiscountedAmount(pooja.baseAmount, pooja.weeklyDiscount),
      normalAmount: getDiscountedAmount(pooja.baseAmount, pooja.normalDiscount),
    };
  }, [copy, pooja, selectedDbLanguage]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-text-primary/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">{copy.loading}</span>
      </div>
    );
  }

  if (error || !pooja || !details) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-text-primary">
          {copy.loadErrorTitle}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || copy.notFound}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.poojas}>{copy.viewAllPoojas}</Link>
        </Button>
      </section>
    );
  }

  return (
    <main className="bg-white pb-16 text-text-primary">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-14">
        <div>
          <nav className="mb-3 text-xs font-bold text-text-primary/55">
            <Link href={APP_ROUTES.poojas} className="hover:text-saffron">
              Pooja
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">{details.title}</span>
          </nav>

          <div className="relative aspect-[16/11] overflow-hidden rounded-lg border-2 border-saffron bg-[#f8fafc]">
            <Image
              src={details.images[0]}
              alt={details.title}
              fill
              priority
              unoptimized={details.images[0].startsWith("http")}
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-extrabold leading-8 text-text-primary md:text-3xl">
            {details.title}
          </h1>
          {details.benifitNames.length > 0 && (
            <p className="mt-3 text-sm font-bold leading-6 text-saffron">
              {details.benifitNames.join(", ")}
            </p>
          )}
          <div className="mt-6 space-y-3 text-sm font-semibold text-text-primary/65">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-primary/45" />
              <span>
                {[details.templeName, details.templePlace, details.templeState]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-text-primary/45" />
              <span>{pooja.poojaDay}</span>
            </p>
          </div>
          <Button asChild className="mt-10 h-12 rounded-lg px-8 font-extrabold">
            <a href="#plans">{copy.selectPlan}</a>
          </Button>
        </div>
      </section>

      <section id="plans" className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <h2 className="text-base font-extrabold text-text-primary">
          {copy.plansTitle}
        </h2>
        <div className="mt-2 h-0.5 w-28 bg-saffron" />
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              title: copy.weeklyPlan,
              subtitle: details.title,
              amount: details.weeklyAmount,
              tag: copy.bestValue,
              features: copy.weeklyFeatures,
            },
            {
              title: copy.singlePlan,
              subtitle: details.title,
              amount: details.normalAmount,
              tag: copy.mostChosen,
              features: copy.singleFeatures,
            },
          ].map((plan) => (
            <article key={plan.title} className="flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_132px] bg-[#fff3df]">
                <div className="p-4">
                  <h3 className="text-sm font-extrabold text-saffron">{plan.title}</h3>
                  <p className="mt-1 text-xs font-bold text-text-primary/70">{plan.subtitle}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <p className="inline-flex items-center text-lg font-extrabold text-saffron">
                      <IndianRupee className="h-4 w-4" />
                      {formatAmount(plan.amount)}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-extrabold text-emerald-700">
                      {plan.tag}
                    </span>
                  </div>
                </div>
                <div className="relative min-h-28 bg-saffron/10">
                  <Image
                    src={details.images[0]}
                    alt={plan.title}
                    fill
                    unoptimized={details.images[0].startsWith("http")}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3 p-4">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-start gap-2 text-sm font-semibold leading-6 text-text-primary/70">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </p>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Button className="h-11 w-full rounded-lg font-extrabold">{copy.bookNow}</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 text-center px-4 pt-14 md:px-8">
        <h2 className="text-xl font-extrabold text-text-primary">
          About this <span className="text-saffron">{copy.breadcrumbPooja}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-sm font-semibold leading-7 text-text-primary/70">
          {details.about}
        </p>
      </section>

      {details.benifits.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl md:px-8">
          <h2 className="text-[26px] font-extrabold leading-8 text-text-primary">
            Why Perform This <span className="text-saffron">{copy.breadcrumbPooja}</span>?
          </h2>
          <div className="mt-2 h-0.5 w-28 bg-saffron" />
          <div className="mt-7 grid gap-10 md:grid-cols-3">
            {details.benifits.slice(0, 3).map((benifit) => (
              <article key={benifit.id} className="flex gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f4f4f4]">
                  {benifit.image && (
                    <Image
                      src={benifit.image}
                      alt={benifit.translation?.name ?? copy.benefitAlt}
                      fill
                      unoptimized={benifit.image.startsWith("http")}
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="text-xl font-extrabold leading-6 text-text-primary">
                    {benifit.translation?.name}
                  </h3>
                  <p className="mt-1 text-lg font-normal leading-7 text-sm">
                    {benifit.translation?.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-7xl border-t border-black/10 px-4 pt-14 md:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.packagePrefix} <span className="text-saffron">{copy.packageHighlight}</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-text-primary/60">
            {copy.packageSubtitle}
          </p>
        </div>
        <div className="mt-10 grid gap-7 md:grid-cols-2">
          {copy.packageIncludes.map((item, index) => {
            const Icon = packageIncludes[index]?.icon ?? Home;            return (
              <article key={item.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron/10 text-saffron">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-text-primary/60">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col gap-4 rounded-lg bg-emerald-50 px-6 py-5 text-sm font-bold text-text-primary/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-700" />
            <span className="text-text-primary">{copy.promiseTitle}</span>
          </div>
          <p>{copy.promiseText}</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {copy.promiseBadges.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-emerald-800">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 bg-[#fff8f2] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl font-extrabold text-text-primary">
            {copy.workflowPrefix} <span className="text-saffron">{copy.workflowHighlight}</span> {copy.workflowSuffix}
          </h2>
          <p className="mt-1 text-sm font-semibold text-text-primary/60">
            {copy.workflowSubtitle}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {copy.workflowSteps.map((step, index) => {
              const style = workflowSteps[index] ?? workflowSteps[0];
              const Icon = style.icon;
              return (
                <article key={step.title} className={`rounded-lg border p-5 ${style.tone}`}>
                  <Icon className="h-5 w-5" />
                  <h3 className="mt-4 text-xs font-extrabold uppercase">{step.title}</h3>
                  <p className="mt-3 min-h-12 text-xs font-semibold leading-5 text-text-primary/70">
                    {step.description}
                  </p>
                  {index < copy.workflowSteps.length - 1 && (
                    <ArrowRight className="mt-3 hidden h-5 w-5 text-saffron lg:block" />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <h2 className="text-xl font-extrabold text-text-primary">
          {copy.faqTitle}
        </h2>
        <div className="mt-5 divide-y divide-black/10">
          {details.faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-text-primary">
                {faq.question}
                <CircleDot className="h-4 w-4 shrink-0 text-text-primary/45 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-primary/65">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
