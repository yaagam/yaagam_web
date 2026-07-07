import type { Language } from "@/translations/locales";

export type DetailCopy = {
  loading: string;
  loadErrorTitle: string;
  notFound: string; 
  viewAllPoojas: string; 
  breadcrumbPooja: string; 
  selectPlan: string; 
  aboutPrefix: string; 
  aboutHighlight: string; 
  defaultPoojaTitle: string; 
  defaultPoojaAbout: string; 
  defaultTemple: string; 
  benefitAlt: string; 
  plansTitle: string; 
  weeklyPlan: string; 
  singlePlan: string; 
  bestValue: string; 
  mostChosen: string; 
  weeklyFeatures: string[]; 
  singleFeatures: string[]; 
  bookNow: string; 
  whyPrefix: string; 
  whyHighlight: string; 
  whySuffix: string; 
  packagePrefix: string; 
  packageHighlight: string; 
  packageSubtitle: string; 
  packageIncludes: Array<{ title: string; description: string }>; 
  promiseTitle: string; 
  promiseText: string; 
  promiseBadges: string[]; 
  workflowPrefix: string; 
  workflowHighlight: string; 
  workflowSuffix: string; 
  workflowSubtitle: string; 
  workflowSteps: Array<{ title: string; description: string }>; 
  faqTitle: string; faqBenefitsQuestion: (title: string) => string; 
  faqBenefitsAnswer: (title: string, benefit: string) => string; 
  faqMantraQuestion: string; 
  faqMantraAnswer: string; 
  faqParticipateQuestion: string; 
  faqParticipateAnswer: string; 
  faqPrasadQuestion: string; 
  faqPrasadAnswer: string; 
  spiritualWellBeing: string;
  breadCrumps: string;
};

const makeDetailCopy = (copy: DetailCopy) => copy;

const enDetailCopy = makeDetailCopy({
  loading: "Loading pooja details", 
  loadErrorTitle: "Could not load pooja",
  notFound: "Pooja not found.",
  viewAllPoojas: "View all poojas", 
  breadcrumbPooja: "Pooja", 
  selectPlan: "Select Pooja Plan", 
  aboutPrefix: "About this", 
  aboutHighlight: "Pooja", 
  defaultPoojaTitle: "Pooja", 
  defaultPoojaAbout: "Temple pooja performed with devotion.", 
  defaultTemple: "Temple", 
  benefitAlt: "Pooja benefit", 
  plansTitle: "Available Pooja Options", 
  weeklyPlan: "Weekly Pooja Plan", 
  singlePlan: "Single Day Pooja", 
  bestValue: "Best Value", 
  mostChosen: "Most Chosen", 
  weeklyFeatures: ["You can cancel weekly plan any time", "Full puja video shared with you", "Live updates via WhatsApp", "Blessed Prasad delivered to your home in every week"], 
  singleFeatures: ["Single Day Pooja", "Full puja video shared with you", "Live updates via WhatsApp", "Blessed Prasad delivered to your home"], 
  bookNow: "Book Now", 
  whyPrefix: "Why Perform This", 
  whyHighlight: "Pooja", 
  whySuffix: "?", packagePrefix: "Our Pooja", 
  packageHighlight: "Package Includes", 
  packageSubtitle: "Here is what you get with every booking", 
  packageIncludes: [{ title: "Puja Performed at Temple", description: "An experienced pandit performs the puja following proper Vedic rituals at the temple." }, { title: "Authentic Prasad Box", description: "Prasad prepared at the temple will be packed and delivered to your home." }, { title: "Live WhatsApp Updates", description: "Get updates on WhatsApp for all important steps of your puja." }, { title: "Personalised Puja Video", description: "Full video of your puja with sankalp, chanting, and a WhatsApp link." }], 
  promiseTitle: "Our Promise", 
  promiseText: "If pooja is not performed, or video is not delivered, we assure you a 100% refund.", 
  promiseBadges: ["100% Refund", "Guaranteed Video", "No Questions Asked"], 
  workflowPrefix: "How", 
  workflowHighlight: "Participation in Pooja", 
  workflowSuffix: "Works", 
  workflowSubtitle: "Here is our pooja workflow",
  workflowSteps: [{ title: "Select Pooja Plan", description: "You are selected a pooja plan" }, { title: "Booked", description: "Your pooja is booked successfully." }, { title: "Scheduled", description: "Pooja is scheduled for the upcoming pooja day." }, { title: "Processing", description: "Pooja is in progress. Please wait for updates." }, { title: "Completed", description: "Photos and videos are sent on WhatsApp." }], 
  faqTitle: "Frequently Asked Questions", faqBenefitsQuestion: (title) => `What are the benefits of ${title}?`, faqBenefitsAnswer: (title, benefit) => `${title} is performed for ${benefit.toLowerCase()} and for receiving divine blessings with devotion.`, 
  faqMantraQuestion: "Which mantra is powerful for this pooja?", 
  faqMantraAnswer: "The pandit uses the appropriate Vedic mantras and sankalp based on the pooja and temple tradition.", 
  faqParticipateQuestion: "Can I participate from home?", 
  faqParticipateAnswer: "Yes. The pooja is performed at the temple on your behalf, and updates are shared through WhatsApp.", 
  faqPrasadQuestion: "Will I receive prasad?", 
  faqPrasadAnswer: "Yes. Prasad is packed after the ceremony and delivered to your home where service is available.", 
  spiritualWellBeing: "spiritual well-being",
  breadCrumps: 'Poojas'
});

export const detailCopy: Record<Language, DetailCopy> = {
  en: enDetailCopy,
  ml: { ...enDetailCopy, breadCrumps: 'പൂജകൾ', loading: "പൂജ വിശദാംശങ്ങൾ ലോഡ് ചെയ്യുന്നു", loadErrorTitle: "പൂജ ലോഡ് ചെയ്യാനായില്ല", notFound: "പൂജ കണ്ടെത്താനായില്ല.", viewAllPoojas: "എല്ലാ പൂജകളും കാണുക", breadcrumbPooja: "പൂജ", selectPlan: "പൂജ പ്ലാൻ തിരഞ്ഞെടുക്കുക", aboutPrefix: "ഈ", aboutHighlight: "പൂജയെക്കുറിച്ച്", plansTitle: "ലഭ്യമായ പൂജ ഓപ്ഷനുകൾ", weeklyPlan: "ആഴ്ചതോറുമുള്ള പൂജ പ്ലാൻ", singlePlan: "ഒറ്റ ദിവസത്തെ പൂജ", bestValue: "മികച്ച മൂല്യം", mostChosen: "കൂടുതൽ തിരഞ്ഞെടുക്കുന്നത്", weeklyFeatures: ["പ്ലാൻ ഏത് സമയത്തും റദ്ദാക്കാം", "പൂജ വീഡിയോ ലഭിക്കും", "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", "പ്രസാദം വീട്ടിലെത്തും"], singleFeatures: ["ഒറ്റ ദിവസത്തെ പൂജ", "പൂജ വീഡിയോ ലഭിക്കും", "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", "പ്രസാദം വീട്ടിലെത്തും"], bookNow: "ഇപ്പോൾ ബുക്ക് ചെയ്യുക", whyPrefix: "ഈ", whyHighlight: "പൂജ", whySuffix: " എന്തിന് ചെയ്യണം?", packagePrefix: "ഞങ്ങളുടെ പൂജ", packageHighlight: "പാക്കേജിൽ ഉൾപ്പെടുന്നത്", packageSubtitle: "ഓരോ ബുക്കിംഗിലും ലഭിക്കുന്നത് ഇവയാണ്", packageIncludes: [{ title: "ക്ഷേത്രത്തിൽ പൂജ", description: "പണ്ഡിതൻ ക്ഷേത്രത്തിൽ ശരിയായ വിധിയിൽ പൂജ നടത്തും." }, { title: "പ്രസാദ ബോക്സ്", description: "ക്ഷേത്ര പ്രസാദം പാക്ക് ചെയ്ത് വീട്ടിലെത്തിക്കും." }, { title: "വാട്ട്സ്ആപ്പ് അപ്ഡേറ്റുകൾ", description: "പൂജയുടെ പ്രധാന അപ്ഡേറ്റുകൾ ലഭിക്കും." }, { title: "പൂജ വീഡിയോ", description: "നിങ്ങളുടെ പൂജയുടെ വീഡിയോ ലിങ്ക് ലഭിക്കും." }], promiseTitle: "ഞങ്ങളുടെ വാഗ്ദാനം", promiseText: "പൂജയോ വീഡിയോയോ ലഭിക്കാത്ത പക്ഷം 100% റീഫണ്ട് ഉറപ്പ്.", promiseBadges: ["100% റീഫണ്ട്", "വീഡിയോ ഉറപ്പ്", "ചോദ്യങ്ങളില്ല"], workflowPrefix: "പൂജയിൽ", workflowHighlight: "പങ്കെടുക്കുന്നത്", workflowSuffix: "എങ്ങനെ പ്രവർത്തിക്കുന്നു", workflowSubtitle: "ഞങ്ങളുടെ പൂജ പ്രവാഹം ഇതാണ്", workflowSteps: [{ title: "പ്ലാൻ തിരഞ്ഞെടുക്കുക", description: "നിങ്ങൾ പൂജ പ്ലാൻ തിരഞ്ഞെടുത്തു" }, { title: "ബുക്ക് ചെയ്തു", description: "പൂജ വിജയകരമായി ബുക്ക് ചെയ്തു." }, { title: "ഷെഡ്യൂൾ ചെയ്തു", description: "പൂജ അടുത്ത ദിവസം നടത്തും." }, { title: "നടക്കുന്നു", description: "പൂജ പുരോഗമിക്കുന്നു." }, { title: "പൂർത്തിയായി", description: "ഫോട്ടോയും വീഡിയോയും അയച്ചു." }], faqTitle: "പതിവ് ചോദ്യങ്ങൾ", faqBenefitsQuestion: (title) => `${title}യുടെ ഗുണങ്ങൾ എന്തൊക്കെയാണ്?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit}യ്ക്കും ദൈവാനുഗ്രഹത്തിനുമായി നടത്തുന്നു.`, faqMantraQuestion: "ഈ പൂജയ്ക്ക് ഏത് മന്ത്രമാണ്?", faqMantraAnswer: "ക്ഷേത്രപരമ്പര അനുസരിച്ച് പണ്ഡിതൻ മന്ത്രങ്ങൾ ജപിക്കും.", faqParticipateQuestion: "വീട്ടിൽ നിന്ന് പങ്കെടുക്കാമോ?", faqParticipateAnswer: "അതെ. അപ്ഡേറ്റുകൾ വാട്ട്സ്ആപ്പിൽ ലഭിക്കും.", faqPrasadQuestion: "പ്രസാദം ലഭിക്കുമോ?", faqPrasadAnswer: "അതെ. പ്രസാദം വീട്ടിലെത്തിക്കും.", spiritualWellBeing: "ആത്മീയ ക്ഷേമം" },
  hi: { ...enDetailCopy, loading: "पूजा विवरण लोड हो रहा है", loadErrorTitle: "पूजा लोड नहीं हो सकी", notFound: "पूजा नहीं मिली.", viewAllPoojas: "सभी पूजाएं देखें", breadcrumbPooja: "पूजा", selectPlan: "पूजा प्लान चुनें", aboutPrefix: "इस", aboutHighlight: "पूजा के बारे में", plansTitle: "उपलब्ध पूजा विकल्प", weeklyPlan: "साप्ताहिक पूजा प्लान", singlePlan: "एक दिन की पूजा", bestValue: "सर्वश्रेष्ठ मूल्य", mostChosen: "सबसे अधिक चुना गया", weeklyFeatures: ["प्लान कभी भी रद्द करें", "पूजा वीडियो मिलेगा", "WhatsApp अपडेट मिलेंगे", "प्रसाद घर पहुंचेगा"], singleFeatures: ["एक दिन की पूजा", "पूजा वीडियो मिलेगा", "WhatsApp अपडेट मिलेंगे", "प्रसाद घर पहुंचेगा"], bookNow: "अभी बुक करें", whyPrefix: "यह", whyHighlight: "पूजा", whySuffix: " क्यों करें?", packagePrefix: "हमारे पूजा", packageHighlight: "पैकेज में शामिल है", packageSubtitle: "हर बुकिंग में आपको यह मिलता है", packageIncludes: [{ title: "मंदिर में पूजा", description: "पंडित मंदिर में विधिपूर्वक पूजा करेंगे." }, { title: "प्रसाद बॉक्स", description: "मंदिर का प्रसाद घर भेजा जाएगा." }, { title: "WhatsApp अपडेट", description: "पूजा के अपडेट WhatsApp पर मिलेंगे." }, { title: "पूजा वीडियो", description: "आपकी पूजा का वीडियो लिंक मिलेगा." }], promiseTitle: "हमारा वादा", promiseText: "पूजा या वीडियो न मिलने पर 100% रिफंड.", promiseBadges: ["100% रिफंड", "वीडियो गारंटी", "कोई सवाल नहीं"], workflowPrefix: "पूजा में", workflowHighlight: "भागीदारी", workflowSuffix: "कैसे होती है", workflowSubtitle: "यह हमारा पूजा वर्कफ्लो है", workflowSteps: [{ title: "प्लान चुनें", description: "आपने पूजा प्लान चुना है" }, { title: "बुक हुआ", description: "पूजा सफलतापूर्वक बुक हुई." }, { title: "शेड्यूल", description: "पूजा अगले दिन होगी." }, { title: "प्रक्रिया में", description: "पूजा चल रही है." }, { title: "पूर्ण", description: "फोटो और वीडियो भेजे गए." }], faqTitle: "अक्सर पूछे जाने वाले प्रश्न", faqBenefitsQuestion: (title) => `${title} के लाभ क्या हैं?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} और आशीर्वाद के लिए की जाती है.`, faqMantraQuestion: "कौन सा मंत्र किया जाता है?", faqMantraAnswer: "पंडित मंदिर परंपरा के अनुसार मंत्र जप करते हैं.", faqParticipateQuestion: "क्या घर से भाग ले सकते हैं?", faqParticipateAnswer: "हाँ. अपडेट WhatsApp पर मिलेंगे.", faqPrasadQuestion: "क्या प्रसाद मिलेगा?", faqPrasadAnswer: "हाँ. प्रसाद घर भेजा जाएगा.", spiritualWellBeing: "आध्यात्मिक कल्याण" },
  mr: { ...enDetailCopy, loading: "पूजेचे तपशील लोड होत आहेत", loadErrorTitle: "पूजा लोड होऊ शकली नाही", notFound: "पूजा सापडली नाही.", viewAllPoojas: "सर्व पूजा पहा", breadcrumbPooja: "पूजा", selectPlan: "पूजा प्लॅन निवडा", aboutPrefix: "या", aboutHighlight: "पूजेबद्दल", plansTitle: "उपलब्ध पूजा पर्याय", weeklyPlan: "साप्ताहिक पूजा प्लॅन", singlePlan: "एक दिवसाची पूजा", bestValue: "सर्वोत्तम मूल्य", mostChosen: "सर्वाधिक निवडलेले", weeklyFeatures: ["प्लॅन कधीही रद्द करा", "पूजा व्हिडिओ मिळेल", "WhatsApp अपडेट्स मिळतील", "प्रसाद घरी येईल"], singleFeatures: ["एक दिवसाची पूजा", "पूजा व्हिडिओ मिळेल", "WhatsApp अपडेट्स मिळतील", "प्रसाद घरी येईल"], bookNow: "आता बुक करा", whyPrefix: "ही", whyHighlight: "पूजा", whySuffix: " का करावी?", packagePrefix: "आमच्या पूजा", packageHighlight: "पॅकेजमध्ये समाविष्ट", packageSubtitle: "प्रत्येक बुकिंगमध्ये तुम्हाला हे मिळते", packageIncludes: [{ title: "मंदिरात पूजा", description: "पंडित मंदिरात विधिपूर्वक पूजा करतील." }, { title: "प्रसाद बॉक्स", description: "मंदिराचा प्रसाद घरी पाठवला जाईल." }, { title: "WhatsApp अपडेट्स", description: "पूजेचे अपडेट्स WhatsApp वर मिळतील." }, { title: "पूजा व्हिडिओ", description: "तुमच्या पूजेचा व्हिडिओ लिंक मिळेल." }], promiseTitle: "आमचे वचन", promiseText: "पूजा किंवा व्हिडिओ न मिळाल्यास 100% परतावा.", promiseBadges: ["100% परतावा", "व्हिडिओ हमी", "प्रश्न नाहीत"], workflowPrefix: "पूजेत", workflowHighlight: "सहभाग", workflowSuffix: "कसा होतो", workflowSubtitle: "हा आमचा पूजा वर्कफ्लो आहे", workflowSteps: [{ title: "प्लॅन निवडा", description: "तुम्ही पूजा प्लॅन निवडला आहे" }, { title: "बुक झाले", description: "पूजा यशस्वीरित्या बुक झाली." }, { title: "शेड्यूल", description: "पूजा पुढील दिवशी होईल." }, { title: "प्रक्रियेत", description: "पूजा सुरू आहे." }, { title: "पूर्ण", description: "फोटो आणि व्हिडिओ पाठवले." }], faqTitle: "वारंवार विचारले जाणारे प्रश्न", faqBenefitsQuestion: (title) => `${title} चे लाभ काय आहेत?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} आणि आशीर्वादासाठी केली जाते.`, faqMantraQuestion: "कोणता मंत्र केला जातो?", faqMantraAnswer: "पंडित मंदिर परंपरेनुसार मंत्र जप करतात.", faqParticipateQuestion: "घरून सहभागी होता येईल का?", faqParticipateAnswer: "हो. अपडेट्स WhatsApp वर मिळतील.", faqPrasadQuestion: "प्रसाद मिळेल का?", faqPrasadAnswer: "हो. प्रसाद घरी पाठवला जाईल.", spiritualWellBeing: "आध्यात्मिक कल्याण" },
  ta: { ...enDetailCopy, loading: "பூஜை விவரங்கள் ஏற்றப்படுகின்றன", loadErrorTitle: "பூஜையை ஏற்ற முடியவில்லை", notFound: "பூஜை கிடைக்கவில்லை.", viewAllPoojas: "அனைத்து பூஜைகளையும் பார்க்க", breadcrumbPooja: "பூஜை", selectPlan: "பூஜை திட்டத்தை தேர்ந்தெடுக்கவும்", aboutPrefix: "இந்த", aboutHighlight: "பூஜை பற்றி", plansTitle: "கிடைக்கும் பூஜை விருப்பங்கள்", weeklyPlan: "வாராந்திர பூஜை திட்டம்", singlePlan: "ஒரு நாள் பூஜை", bestValue: "சிறந்த மதிப்பு", mostChosen: "அதிகம் தேர்ந்தெடுக்கப்பட்டது", weeklyFeatures: ["திட்டத்தை எப்போது வேண்டுமானாலும் ரத்து செய்யலாம்", "பூஜை வீடியோ கிடைக்கும்", "WhatsApp புதுப்பிப்புகள் கிடைக்கும்", "பிரசாதம் வீட்டிற்கு வரும்"], singleFeatures: ["ஒரு நாள் பூஜை", "பூஜை வீடியோ கிடைக்கும்", "WhatsApp புதுப்பிப்புகள் கிடைக்கும்", "பிரசாதம் வீட்டிற்கு வரும்"], bookNow: "இப்போது பதிவு செய்யவும்", whyPrefix: "இந்த", whyHighlight: "பூஜை", whySuffix: " ஏன் செய்ய வேண்டும்?", packagePrefix: "எங்கள் பூஜை", packageHighlight: "தொகுப்பில் அடங்கும்", packageSubtitle: "ஒவ்வொரு பதிவிலும் நீங்கள் பெறுவது இதுதான்", packageIncludes: [{ title: "கோவிலில் பூஜை", description: "பண்டிதர் கோவிலில் முறையாக பூஜை செய்வார்." }, { title: "பிரசாத பெட்டி", description: "கோவில் பிரசாதம் வீட்டிற்கு அனுப்பப்படும்." }, { title: "WhatsApp புதுப்பிப்புகள்", description: "பூஜை புதுப்பிப்புகள் WhatsApp இல் கிடைக்கும்." }, { title: "பூஜை வீடியோ", description: "உங்கள் பூஜை வீடியோ இணைப்பு கிடைக்கும்." }], promiseTitle: "எங்கள் வாக்குறுதி", promiseText: "பூஜை அல்லது வீடியோ கிடைக்காவிட்டால் 100% பணம் திருப்பித் தரப்படும்.", promiseBadges: ["100% திருப்பித் தரல்", "வீடியோ உத்தரவாதம்", "கேள்விகள் இல்லை"], workflowPrefix: "பூஜையில்", workflowHighlight: "பங்கேற்பது", workflowSuffix: "எப்படி வேலை செய்கிறது", workflowSubtitle: "எங்கள் பூஜை செயல்முறை இதோ", workflowSteps: [{ title: "திட்டம் தேர்வு", description: "நீங்கள் பூஜை திட்டத்தை தேர்ந்தெடுத்துள்ளீர்கள்" }, { title: "பதிவு", description: "பூஜை வெற்றிகரமாக பதிவு செய்யப்பட்டது." }, { title: "திட்டமிடப்பட்டது", description: "பூஜை அடுத்த நாளில் நடைபெறும்." }, { title: "நடைபெறுகிறது", description: "பூஜை நடைபெறுகிறது." }, { title: "முடிந்தது", description: "புகைப்படமும் வீடியோவும் அனுப்பப்பட்டது." }], faqTitle: "அடிக்கடி கேட்கப்படும் கேள்விகள்", faqBenefitsQuestion: (title) => `${title} பலன்கள் என்ன?`, faqBenefitsAnswer: (title, benefit) => `${title} ${benefit} மற்றும் ஆசீர்வாதத்திற்காக செய்யப்படுகிறது.`, faqMantraQuestion: "எந்த மந்திரம் செய்யப்படும்?", faqMantraAnswer: "பண்டிதர் கோவில் மரபின்படி மந்திரம் செய்வார்.", faqParticipateQuestion: "வீட்டிலிருந்து பங்கேற்கலாமா?", faqParticipateAnswer: "ஆம். புதுப்பிப்புகள் WhatsApp இல் கிடைக்கும்.", faqPrasadQuestion: "பிரசாதம் கிடைக்குமா?", faqPrasadAnswer: "ஆம். பிரசாதம் வீட்டிற்கு அனுப்பப்படும்.", spiritualWellBeing: "ஆன்மீக நலம்" },
};
