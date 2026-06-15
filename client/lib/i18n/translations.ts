export const languages = ["en", "ml", "hi"] as const

export type Language = (typeof languages)[number]

export const languageNames: Record<Language, string> = {
  en: "English",
  ml: "മലയാളം",
  hi: "हिन्दी",
}

export const translations = {
  en: {
    nav: { poojas: "Poojas", panchang: "Panchang", login: "Login", selectLanguage: "Select language", openMenu: "Open navigation menu", closeMenu: "Close navigation menu", mainNavigation: "Main navigation", mobileNavigation: "Mobile navigation" },
    hero: { trusted: "Trusted temple rituals, made accessible", line1: "Bring devotion home.", line2: "Book poojas with", description: "Join authentic rituals performed by trusted Vedic pandits at sacred temples across India.", explore: "Explore Poojas", authentic: "Authentic rituals by Vedic pandits", temples: "Sacred temples across India", secure: "Trusted and secure booking", selectBanner: "Select banner image", showBanner: "Show banner image" },
    home: {
      trustLabel: "Why devotees trust Yaagam", devotees: "10,000+ devotees", devoteesSub: "Supported across India", rating: "4.8 devotee rating", ratingSub: "Trusted service and updates", prasad: "Authentic prasad", prasadSub: "Delivered from the temple",
      upcomingEyebrow: "Upcoming sacred rituals", upcomingTitle: "Popular poojas on Yaagam", upcomingDescription: "Choose a pooja, add your family details, and participate from wherever you are.", viewAll: "View all poojas",
      bookingEyebrow: "Easy from start to finish", bookingTitle: "How to book a pooja with Yaagam", bookingSteps: [
        { title: "Share your details", description: "Add the names and gotra of family members joining the pooja." },
        { title: "The temple performs your pooja", description: "Trusted Vedic pandits perform the ritual in your name." },
        { title: "Receive photo and video updates", description: "Follow your pooja through clear updates sent to you." },
        { title: "Prasad reaches your home", description: "Sacred prasad is packed carefully and delivered to your address." },
      ],
      ceremonyAlt: "A sacred temple pooja ceremony", playGuide: "Play guide to booking a pooja",
      guideEyebrow: "Your spiritual companion", guideTitle: "A simple guide through your dharmik journey", guideDescription: "Explore practical guidance, sacred traditions, and temple services in one trusted place.", guides: [
        { title: "Daily Panchang", description: "Plan important moments with simple daily Panchang guidance.", action: "View Panchang" },
        { title: "Pooja and Sevas", description: "Find the right temple ritual for health, peace, and prosperity.", action: "Explore Poojas" },
        { title: "Dharmik Knowledge", description: "Understand mantras, festivals, rituals, and sacred traditions.", action: "Start Reading" },
        { title: "Temples of India", description: "Discover sacred temples, their stories, and special offerings.", action: "Explore Temples" },
      ],
      testimonialsEyebrow: "Real devotee experiences", testimonialsTitle: "What devotees say about Yaagam", testimonialsRating: "9 out of 10 devotees rate Yaagam 5 stars",
    },
    login: { button: "Login", welcome: "Welcome to Yaagam", phoneDescription: "Enter your WhatsApp number to receive a secure one-time password.", phoneLabel: "WhatsApp number", invalidPhone: "Enter a valid 10-digit Indian mobile number.", sendOtp: "Send OTP on WhatsApp", privacy: "Your number is used only for login and booking updates.", verifyTitle: "Verify your number", codeSent: "We sent a 6-digit code on WhatsApp to", codeLabel: "Verification code", invalidCode: "Enter the 6-digit verification code.", verify: "Verify & Login", changeNumber: "Change number", resend: "Resend code", success: "Successfully Logged In", sendError: "Unable to send OTP. Please try again.", verifyError: "Unable to verify OTP. Please try again." },
    card: { every: "Every", in: "in", bookNow: "Book Now", subscription: "Weekly subscription available" },
    footer: { getItOn: "Get it on", quickLinks: "Quick Links", visit: "Visit Yaagam", morePoojas: "More Pujas", blogs: "Read Blogs", contact: "Contact Us", grievance: "Grievance Redressal", about: "About Us", company: "Company & Office", rights: "© 2026 Yaagam Applications Pvt. Ltd. All rights reserved.", terms: "Terms of Use", refund: "Refund & Cancellation Policy" },
  },
  ml: {
    nav: { poojas: "പൂജകൾ", panchang: "പഞ്ചാംഗം", login: "ലോഗിൻ", selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക", openMenu: "നാവിഗേഷൻ മെനു തുറക്കുക", closeMenu: "നാവിഗേഷൻ മെനു അടയ്ക്കുക", mainNavigation: "പ്രധാന നാവിഗേഷൻ", mobileNavigation: "മൊബൈൽ നാവിഗേഷൻ" },
    hero: { trusted: "വിശ്വസനീയമായ ക്ഷേത്ര പൂജകൾ ഇനി എളുപ്പത്തിൽ", line1: "ഭക്തി വീട്ടിലെത്തിക്കൂ.", line2: "പൂജകൾ ബുക്ക് ചെയ്യൂ", description: "ഇന്ത്യയിലെ പുണ്യക്ഷേത്രങ്ങളിൽ വിശ്വസനീയരായ വേദപണ്ഡിതർ നടത്തുന്ന ആധികാരിക പൂജകളിൽ പങ്കുചേരൂ.", explore: "പൂജകൾ കാണുക", authentic: "വേദപണ്ഡിതരുടെ ആധികാരിക പൂജകൾ", temples: "ഇന്ത്യയിലുടനീളമുള്ള പുണ്യക്ഷേത്രങ്ങൾ", secure: "വിശ്വസനീയവും സുരക്ഷിതവുമായ ബുക്കിംഗ്", selectBanner: "ബാനർ ചിത്രം തിരഞ്ഞെടുക്കുക", showBanner: "ബാനർ ചിത്രം കാണിക്കുക" },
    home: {
      trustLabel: "ഭക്തർ യാഗത്തെ വിശ്വസിക്കുന്നതെന്തുകൊണ്ട്", devotees: "10,000+ ഭക്തർ", devoteesSub: "ഇന്ത്യയിലുടനീളം സേവനം", rating: "4.8 ഭക്ത റേറ്റിംഗ്", ratingSub: "വിശ്വസനീയ സേവനവും അപ്ഡേറ്റുകളും", prasad: "ആധികാരിക പ്രസാദം", prasadSub: "ക്ഷേത്രത്തിൽ നിന്ന് വീട്ടിലെത്തിക്കുന്നു",
      upcomingEyebrow: "വരാനിരിക്കുന്ന പുണ്യകർമ്മങ്ങൾ", upcomingTitle: "യാഗത്തിലെ ജനപ്രിയ പൂജകൾ", upcomingDescription: "ഒരു പൂജ തിരഞ്ഞെടുക്കുക, കുടുംബവിവരങ്ങൾ ചേർക്കുക, എവിടെ നിന്നുമെങ്കിലും പങ്കെടുക്കുക.", viewAll: "എല്ലാ പൂജകളും കാണുക",
      bookingEyebrow: "തുടക്കം മുതൽ അവസാനം വരെ ലളിതം", bookingTitle: "യാഗത്തിലൂടെ പൂജ ബുക്ക് ചെയ്യുന്നതെങ്ങനെ", bookingSteps: [
        { title: "നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക", description: "പൂജയിൽ പങ്കെടുക്കുന്ന കുടുംബാംഗങ്ങളുടെ പേരും ഗോത്രവും ചേർക്കുക." },
        { title: "ക്ഷേത്രത്തിൽ നിങ്ങളുടെ പൂജ നടത്തുന്നു", description: "വിശ്വസനീയരായ വേദപണ്ഡിതർ നിങ്ങളുടെ പേരിൽ കർമ്മം നടത്തുന്നു." },
        { title: "ഫോട്ടോ, വീഡിയോ അപ്ഡേറ്റുകൾ ലഭിക്കുക", description: "നിങ്ങൾക്ക് അയക്കുന്ന വ്യക്തമായ അപ്ഡേറ്റുകളിലൂടെ പൂജ പിന്തുടരുക." },
        { title: "പ്രസാദം വീട്ടിലെത്തുന്നു", description: "പുണ്യപ്രസാദം ശ്രദ്ധാപൂർവ്വം പാക്ക് ചെയ്ത് നിങ്ങളുടെ വിലാസത്തിൽ എത്തിക്കുന്നു." },
      ],
      ceremonyAlt: "പുണ്യമായ ക്ഷേത്ര പൂജാകർമ്മം", playGuide: "പൂജ ബുക്കിംഗ് മാർഗ്ഗനിർദ്ദേശം കാണുക",
      guideEyebrow: "നിങ്ങളുടെ ആത്മീയ സഹായി", guideTitle: "ധാർമിക യാത്രയ്ക്കുള്ള ലളിതമായ വഴികാട്ടി", guideDescription: "പ്രായോഗിക മാർഗ്ഗനിർദ്ദേശങ്ങളും പുണ്യപാരമ്പര്യങ്ങളും ക്ഷേത്രസേവനങ്ങളും ഒരിടത്ത് കണ്ടെത്തൂ.", guides: [
        { title: "ദൈനംദിന പഞ്ചാംഗം", description: "ലളിതമായ ദൈനംദിന പഞ്ചാംഗ മാർഗ്ഗനിർദ്ദേശത്തോടെ പ്രധാന നിമിഷങ്ങൾ ആസൂത്രണം ചെയ്യൂ.", action: "പഞ്ചാംഗം കാണുക" },
        { title: "പൂജകളും സേവകളും", description: "ആരോഗ്യം, സമാധാനം, സമൃദ്ധി എന്നിവയ്ക്കുള്ള ശരിയായ ക്ഷേത്രകർമ്മം കണ്ടെത്തൂ.", action: "പൂജകൾ കാണുക" },
        { title: "ധാർമിക അറിവ്", description: "മന്ത്രങ്ങൾ, ഉത്സവങ്ങൾ, കർമ്മങ്ങൾ, പുണ്യപാരമ്പര്യങ്ങൾ എന്നിവ മനസ്സിലാക്കൂ.", action: "വായന തുടങ്ങുക" },
        { title: "ഇന്ത്യയിലെ ക്ഷേത്രങ്ങൾ", description: "പുണ്യക്ഷേത്രങ്ങളും അവയുടെ കഥകളും പ്രത്യേക വഴിപാടുകളും കണ്ടെത്തൂ.", action: "ക്ഷേത്രങ്ങൾ കാണുക" },
      ],
      testimonialsEyebrow: "ഭക്തരുടെ യഥാർത്ഥ അനുഭവങ്ങൾ", testimonialsTitle: "യാഗത്തെക്കുറിച്ച് ഭക്തർ പറയുന്നത്", testimonialsRating: "10 ഭക്തരിൽ 9 പേർ യാഗത്തിന് 5 നക്ഷത്രം നൽകുന്നു",
    },
    login: { button: "ലോഗിൻ", welcome: "യാഗത്തിലേക്ക് സ്വാഗതം", phoneDescription: "സുരക്ഷിതമായ ഒറ്റത്തവണ പാസ്‌വേഡ് ലഭിക്കാൻ നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പർ നൽകുക.", phoneLabel: "വാട്സ്ആപ്പ് നമ്പർ", invalidPhone: "സാധുവായ 10 അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക.", sendOtp: "വാട്സ്ആപ്പിൽ OTP അയയ്ക്കുക", privacy: "ലോഗിൻ, ബുക്കിംഗ് അപ്ഡേറ്റുകൾക്കായി മാത്രമാണ് നിങ്ങളുടെ നമ്പർ ഉപയോഗിക്കുന്നത്.", verifyTitle: "നിങ്ങളുടെ നമ്പർ സ്ഥിരീകരിക്കുക", codeSent: "6 അക്ക കോഡ് വാട്സ്ആപ്പിൽ അയച്ചു:", codeLabel: "സ്ഥിരീകരണ കോഡ്", invalidCode: "6 അക്ക സ്ഥിരീകരണ കോഡ് നൽകുക.", verify: "സ്ഥിരീകരിച്ച് ലോഗിൻ ചെയ്യുക", changeNumber: "നമ്പർ മാറ്റുക", resend: "കോഡ് വീണ്ടും അയയ്ക്കുക", success: "വിജയകരമായി ലോഗിൻ ചെയ്തു", sendError: "OTP അയയ്ക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.", verifyError: "OTP സ്ഥിരീകരിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക." },
    card: { every: "എല്ലാ", in: "ൽ", bookNow: "ഇപ്പോൾ ബുക്ക് ചെയ്യുക", subscription: "ആഴ്ചതോറുമുള്ള സബ്സ്ക്രിപ്ഷൻ ലഭ്യമാണ്" },
    footer: { getItOn: "ലഭ്യമാകുന്നത്", quickLinks: "ദ്രുത ലിങ്കുകൾ", visit: "യാഗം സന്ദർശിക്കുക", morePoojas: "കൂടുതൽ പൂജകൾ", blogs: "ബ്ലോഗുകൾ വായിക്കുക", contact: "ബന്ധപ്പെടുക", grievance: "പരാതി പരിഹാരം", about: "ഞങ്ങളെക്കുറിച്ച്", company: "കമ്പനിയും ഓഫീസും", rights: "© 2026 Yaagam Applications Pvt. Ltd. എല്ലാ അവകാശങ്ങളും സംരക്ഷിതം.", terms: "ഉപയോഗ നിബന്ധനകൾ", refund: "റീഫണ്ട്, റദ്ദാക്കൽ നയം" },
  },
  hi: {
    nav: { poojas: "पूजाएँ", panchang: "पंचांग", login: "लॉगिन", selectLanguage: "भाषा चुनें", openMenu: "नेविगेशन मेनू खोलें", closeMenu: "नेविगेशन मेनू बंद करें", mainNavigation: "मुख्य नेविगेशन", mobileNavigation: "मोबाइल नेविगेशन" },
    hero: { trusted: "विश्वसनीय मंदिर अनुष्ठान, अब आसानी से उपलब्ध", line1: "भक्ति को घर लाएँ।", line2: "पूजाएँ बुक करें", description: "भारत के पवित्र मंदिरों में विश्वसनीय वैदिक पंडितों द्वारा किए जाने वाले प्रामाणिक अनुष्ठानों में शामिल हों।", explore: "पूजाएँ देखें", authentic: "वैदिक पंडितों द्वारा प्रामाणिक अनुष्ठान", temples: "भारत भर के पवित्र मंदिर", secure: "विश्वसनीय और सुरक्षित बुकिंग", selectBanner: "बैनर चित्र चुनें", showBanner: "बैनर चित्र दिखाएँ" },
    home: {
      trustLabel: "भक्त यागम पर क्यों भरोसा करते हैं", devotees: "10,000+ भक्त", devoteesSub: "पूरे भारत में सेवा", rating: "4.8 भक्त रेटिंग", ratingSub: "विश्वसनीय सेवा और अपडेट", prasad: "प्रामाणिक प्रसाद", prasadSub: "मंदिर से आपके घर तक",
      upcomingEyebrow: "आगामी पवित्र अनुष्ठान", upcomingTitle: "यागम की लोकप्रिय पूजाएँ", upcomingDescription: "पूजा चुनें, परिवार का विवरण जोड़ें और कहीं से भी भाग लें।", viewAll: "सभी पूजाएँ देखें",
      bookingEyebrow: "शुरुआत से अंत तक आसान", bookingTitle: "यागम पर पूजा कैसे बुक करें", bookingSteps: [
        { title: "अपना विवरण साझा करें", description: "पूजा में शामिल परिवार के सदस्यों के नाम और गोत्र जोड़ें।" },
        { title: "मंदिर आपकी पूजा करता है", description: "विश्वसनीय वैदिक पंडित आपके नाम से अनुष्ठान करते हैं।" },
        { title: "फोटो और वीडियो अपडेट पाएँ", description: "आपको भेजे गए स्पष्ट अपडेट के जरिए अपनी पूजा से जुड़े रहें।" },
        { title: "प्रसाद आपके घर पहुँचता है", description: "पवित्र प्रसाद सावधानी से पैक करके आपके पते पर पहुँचाया जाता है।" },
      ],
      ceremonyAlt: "पवित्र मंदिर पूजा अनुष्ठान", playGuide: "पूजा बुक करने की मार्गदर्शिका चलाएँ",
      guideEyebrow: "आपका आध्यात्मिक साथी", guideTitle: "आपकी धार्मिक यात्रा के लिए सरल मार्गदर्शिका", guideDescription: "व्यावहारिक मार्गदर्शन, पवित्र परंपराएँ और मंदिर सेवाएँ एक विश्वसनीय स्थान पर पाएँ।", guides: [
        { title: "दैनिक पंचांग", description: "सरल दैनिक पंचांग मार्गदर्शन के साथ महत्वपूर्ण समय की योजना बनाएँ।", action: "पंचांग देखें" },
        { title: "पूजा और सेवाएँ", description: "स्वास्थ्य, शांति और समृद्धि के लिए सही मंदिर अनुष्ठान खोजें।", action: "पूजाएँ देखें" },
        { title: "धार्मिक ज्ञान", description: "मंत्रों, त्योहारों, अनुष्ठानों और पवित्र परंपराओं को समझें।", action: "पढ़ना शुरू करें" },
        { title: "भारत के मंदिर", description: "पवित्र मंदिरों, उनकी कथाओं और विशेष अर्पणों को जानें।", action: "मंदिर देखें" },
      ],
      testimonialsEyebrow: "भक्तों के वास्तविक अनुभव", testimonialsTitle: "यागम के बारे में भक्त क्या कहते हैं", testimonialsRating: "10 में से 9 भक्त यागम को 5 स्टार देते हैं",
    },
    login: { button: "लॉगिन", welcome: "यागम में आपका स्वागत है", phoneDescription: "सुरक्षित वन-टाइम पासवर्ड पाने के लिए अपना WhatsApp नंबर दर्ज करें।", phoneLabel: "WhatsApp नंबर", invalidPhone: "मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।", sendOtp: "WhatsApp पर OTP भेजें", privacy: "आपका नंबर केवल लॉगिन और बुकिंग अपडेट के लिए उपयोग किया जाता है।", verifyTitle: "अपना नंबर सत्यापित करें", codeSent: "हमने WhatsApp पर 6 अंकों का कोड भेजा है:", codeLabel: "सत्यापन कोड", invalidCode: "6 अंकों का सत्यापन कोड दर्ज करें।", verify: "सत्यापित करें और लॉगिन करें", changeNumber: "नंबर बदलें", resend: "कोड फिर भेजें", success: "सफलतापूर्वक लॉगिन हुआ", sendError: "OTP भेजा नहीं जा सका। कृपया फिर प्रयास करें।", verifyError: "OTP सत्यापित नहीं हो सका। कृपया फिर प्रयास करें।" },
    card: { every: "हर", in: "में", bookNow: "अभी बुक करें", subscription: "साप्ताहिक सदस्यता उपलब्ध है" },
    footer: { getItOn: "यहाँ उपलब्ध", quickLinks: "त्वरित लिंक", visit: "यागम देखें", morePoojas: "और पूजाएँ", blogs: "ब्लॉग पढ़ें", contact: "संपर्क करें", grievance: "शिकायत निवारण", about: "हमारे बारे में", company: "कंपनी और कार्यालय", rights: "© 2026 Yaagam Applications Pvt. Ltd. सर्वाधिकार सुरक्षित।", terms: "उपयोग की शर्तें", refund: "रिफंड और रद्दीकरण नीति" },
  },
} as const

export type Translations = (typeof translations)["en"]
