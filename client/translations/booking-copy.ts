export type BookingCopy = {
  steps: string[];
  trustItems: Array<{ title: string; text: string }>;
  detailsTitle: string;
  detailsSubtitle: string;
  chooseOfferings: string;
  offeringsSubtitle: string;
  loadingOfferings: string;
  retryOfferings: string;
  noOfferings: string;
  offering: string;
  dakshinaAmount: string;
  dakshinaHelp: string;
  continueToBooking: string;
  invalidDakshina: string;
  offeringsUnavailable: string;
  mostOffered: string;
  add: string;
  added: string;
  addDakshinaForPooja: string;
  popular: string;
  addYourOwn: string;
  customDakshinaPlaceholder: string;
  totalDakshina: string;
  pujaDakshina: string;
  additionalDakshina: string;
  poojaPrice: string;
  selectedOfferings: string;
  offeringTotal: string;
  dakshina: string;
  grandTotal: string;
  loadingBookingDetails: string;
  couldNotLoadBooking: string;
  poojaNotFound: string;
  backToPooja: string;
  name: string;
  namePlaceholder: string;
  whatsappNumber: string;
  whatsappPlaceholder: string;
  whatsappVerified: string;
  verifyWhatsappNumber: string;
  whatsappReady: string;
  whatsappOtpInfo: string;
  changeWhatsappNumber: string;
  sendOtp: string;
  resendOtp: string;
  sending: string;
  verifyAndLogin: string;
  verifying: string;
  state: string;
  selectState: string;
  nakshatra: string;
  selectNakshatra: string;
  naal: string;
  gothra: string;
  selectNaal: string;
  enterGothra: string;
  sankalpa: string;
  optional: string;
  sankalpaPlaceholder: string;
  prasadQuestion: string;
  yes: string;
  no: string;
  houseNo: string;
  houseNoPlaceholder: string;
  gettingLocation: string;
  useCurrentLocation: string;
  roadName: string;
  roadNamePlaceholder: string;
  pincode: string;
  pincodePlaceholder: string;
  district: string;
  selectDistrict: string;
  phoneNumber: string;
  phoneNumberPlaceholder: string;
  completePayment: string;
  paymentSubtitle: string;
  bookingId: string;
  transactionId: string;
  razorpayAutoPayQrId: string;
  googlePayAutoPayQr: string;
  weeklyQrText: string;
  qrUpi: string;
  card: string;
  netbanking: string;
  razorpayCheckoutOption: string;
  backToDetails: string;
  openingRazorpay: string;
  proceedWithRazorpay: string;
  bookingConfirmed: string;
  bookingConfirmedText: string;
  viewMorePoojas: string;
  bookingSummary: string;
  poojaDay: string;
  poojaTime: string;
  planType: string;
  weeklyPlan: string;
  singleDayPlan: string;
  amount: string;
  currencyPrefix: string;
  whatIsIncluded: string;
  prasadam: string;
  photosVideoWhatsapp: string;
  secureBooking: string;
  secureBookingText: string;
  informationSecure: string;
  verifyWhatsappToContinue: string;
  creatingBooking: string;
  continueToPayment: string;
  paymentInProgress: string;
  footerRights: string;
  termsOfUse: string;
  refundPolicy: string;
  validWhatsappError: string;
  otpSent: string;
  sendOtpError: string;
  otpCodeError: string;
  loginError: string;
  whatsappSuccess: string;
  otpRetry: string;
  currentLocationAdded: string;
  locationError: string;
  validationName: string;
  validationWhatsapp: string;
  validationWhatsappVerify: string;
  validationState: string;
  validationNakshatra: string;
  validationRoad: string;
  validationPincode: string;
  validationDistrict: string;
  validationPhone: string;
  checkoutCreated: string;
  bookingCreateError: string;
  paymentVerificationFailed: string;
  autopayQrShown: string;
  razorpayUnavailable: string;
  paymentSuccessful: string;
  openRazorpayError: string;
};

const bookingCopyEn: BookingCopy = {
  steps: ["Add Details", "Payment", "Booking Confirmed"],
  trustItems: [
    { title: "100% Secure", text: "Your data is safe with us" },
    { title: "Trusted Temples", text: "Verified & authentic temples" },
    { title: "Photos & Videos", text: "Delivered on WhatsApp" },
    { title: "Devotion First", text: "Pure rituals, divine blessings" },
  ],
  detailsTitle: "Enter Devotee Details",
  detailsSubtitle: "Please provide the details below to book your pooja",
  chooseOfferings: "Choose Offerings",
  offeringsSubtitle:
    "Select any offerings you would like to include with this pooja.",
  loadingOfferings: "Loading offerings",
  retryOfferings: "Try again",
  noOfferings: "No offerings are available for this pooja.",
  offering: "Offering",
  dakshinaAmount: "Dakshina Amount",
  dakshinaHelp:
    "Dakshina is optional and is kept separate from your selected offerings.",
  continueToBooking: "Continue",
  invalidDakshina: "Dakshina amount cannot be negative.",
  offeringsUnavailable:
    "An offering is no longer available. The offerings list has been refreshed.",
  mostOffered: "Most Offered",
  add: "Add",
  added: "Added",
  addDakshinaForPooja: "Add Dakshina for Pooja",
  popular: "Popular",
  addYourOwn: "Add your own",
  customDakshinaPlaceholder: "Enter a custom Dakshina amount",
  totalDakshina: "Total Dakshina",
  pujaDakshina: "Pooja Dakshina",
  additionalDakshina: "Additional Dakshina",
  poojaPrice: "Pooja Price",
  selectedOfferings: "Selected Offerings",
  offeringTotal: "Offering Total",
  dakshina: "Dakshina",
  grandTotal: "Grand Total",
  loadingBookingDetails: "Loading booking details",
  couldNotLoadBooking: "Could not load booking",
  poojaNotFound: "Pooja not found.",
  backToPooja: "Back to pooja",
  name: "Name",
  namePlaceholder: "Enter your name",
  whatsappNumber: "WhatsApp Number",
  whatsappPlaceholder: "Enter your WhatsApp number",
  whatsappVerified: "WhatsApp Verified",
  verifyWhatsappNumber: "Verify WhatsApp Number",
  whatsappReady: "You are logged in and ready to continue.",
  whatsappOtpInfo:
    "We will send an OTP to your WhatsApp number for verification.",
  changeWhatsappNumber: "Change WhatsApp number",
  sendOtp: "Send OTP",
  resendOtp: "Resend OTP",
  sending: "Sending...",
  verifyAndLogin: "Verify & Login",
  verifying: "Verifying...",
  state: "State",
  selectState: "Select State",
  nakshatra: "Nakshatra",
  selectNakshatra: "Select Nakshatra",
  naal: "Naal",
  gothra: "Gothra",
  selectNaal: "Select Naal",
  enterGothra: "Enter Gothra",
  sankalpa: "Sankalpa / Sankalpam",
  optional: "(Optional)",
  sankalpaPlaceholder: "Enter sankalpa details for the pooja",
  prasadQuestion: "Do you want to receive prasad for the Pooja?",
  yes: "Yes",
  no: "No",
  houseNo: "House No.",
  houseNoPlaceholder: "Enter your house no / floor no.",
  gettingLocation: "Getting location...",
  useCurrentLocation: "Use current location",
  roadName: "Road Name / Street Name / landmark",
  roadNamePlaceholder: "Enter road name or landmark",
  pincode: "Pincode",
  pincodePlaceholder: "Enter your pincode",
  district: "District",
  selectDistrict: "Select District",
  phoneNumber: "Phone Number",
  phoneNumberPlaceholder: "Enter your mobile number",
  completePayment: "Complete Payment",
  paymentSubtitle:
    "Select a payment mode. The backend has already created the payment reference for this booking.",
  bookingId: "Booking ID",
  transactionId: "Transaction ID",
  razorpayAutoPayQrId: "Razorpay AutoPay QR ID",
  googlePayAutoPayQr: "Google Pay AutoPay QR",
  weeklyQrText:
    "Weekly plan shows only the backend-provided AutoPay QR id. Later this will map to Razorpay AutoPay.",
  qrUpi: "QR / UPI",
  card: "Card",
  netbanking: "Netbanking",
  razorpayCheckoutOption: "Backend payment reference",
  backToDetails: "Back to Details",
  openingRazorpay: "Confirming payment...",
  proceedWithRazorpay: "I have completed payment",
  bookingConfirmed: "Booking Confirmed",
  bookingConfirmedText:
    "Your booking and transaction are successful. This screen is shown only after backend payment verification succeeds.",
  viewMorePoojas: "View More Poojas",
  bookingSummary: "Booking Summary",
  poojaDay: "Pooja Day",
  poojaTime: "Pooja Time",
  planType: "Plan type",
  weeklyPlan: "Weekly Plan",
  singleDayPlan: "Single Day Plan",
  amount: "Amount",
  currencyPrefix: "Rs.",
  whatIsIncluded: "What is Included",
  prasadam: "Prasadam",
  photosVideoWhatsapp: "Photos & Video on WhatsApp",
  secureBooking: "Secure Booking",
  secureBookingText: "Your details are encrypted and 100% secure with us.",
  informationSecure:
    "Your information is secure and will only be used for pooja purpose.",
  verifyWhatsappToContinue: "Verify WhatsApp to Continue",
  creatingBooking: "Creating Booking...",
  continueToPayment: "Continue to Payment",
  paymentInProgress: "Payment In Progress",
  footerRights: "? 2026 Yaagam Applications Pvt. Ltd. All rights reserved.",
  termsOfUse: "Terms of Use",
  refundPolicy: "Refund & Cancellation Policy",
  validWhatsappError: "Enter a valid 10-digit WhatsApp number.",
  otpSent: "OTP sent on WhatsApp",
  sendOtpError: "Unable to send OTP. Please try again.",
  otpCodeError: "Enter the 6-digit verification code.",
  loginError: "Unable to complete login. Please try again.",
  whatsappSuccess: "WhatsApp verified successfully",
  otpRetry: "Enter number again",
  currentLocationAdded: "Current location added",
  locationError: "Unable to get current location.",
  validationName: "Enter your name.",
  validationWhatsapp: "Enter your WhatsApp number.",
  validationWhatsappVerify: "Verify your WhatsApp number.",
  validationState: "Select your state.",
  validationNakshatra: "Select your nakshatra.",
  validationRoad: "Enter your road name or landmark.",
  validationPincode: "Enter your pincode.",
  validationDistrict: "Select your district.",
  validationPhone: "Enter your phone number.",
  checkoutCreated: "Checkout session created",
  bookingCreateError: "Unable to create booking. Please try again.",
  paymentVerificationFailed: "Payment verification failed.",
  autopayQrShown: "AutoPay QR shown. Waiting for backend payment status.",
  razorpayUnavailable: "Razorpay Checkout is unavailable.",
  paymentSuccessful: "Payment successful",
  openRazorpayError: "Unable to open Razorpay Checkout.",
};

export const bookingCopy: Record<string, BookingCopy> = {
  en: bookingCopyEn,
  hi: {
    ...bookingCopyEn,
    chooseOfferings: "अर्पण चुनें",
    offeringsSubtitle: "इस पूजा के साथ शामिल करने के लिए कोई भी अर्पण चुनें।",
    loadingOfferings: "अर्पण लोड हो रहे हैं",
    retryOfferings: "फिर से प्रयास करें",
    noOfferings: "इस पूजा के लिए कोई अर्पण उपलब्ध नहीं है।",
    offering: "अर्पण",
    dakshinaAmount: "दक्षिणा राशि",
    dakshinaHelp: "दक्षिणा वैकल्पिक है और चुने गए अर्पणों से अलग रखी जाती है।",
    continueToBooking: "जारी रखें",
    invalidDakshina: "दक्षिणा राशि ऋणात्मक नहीं हो सकती।",
    offeringsUnavailable:
      "एक अर्पण अब उपलब्ध नहीं है। सूची को रीफ़्रेश किया गया है।",
    poojaPrice: "पूजा मूल्य",
    selectedOfferings: "चुने गए अर्पण",
    offeringTotal: "अर्पण कुल",
    dakshina: "दक्षिणा",
    grandTotal: "कुल राशि",
    steps: [
      "विवरण भरें",
      "भुगतान",
      "बुकिंग पुष्टि",
      "पूजा निर्धारित",
      "पूजा पूर्ण",
    ],
    trustItems: [
      { title: "100% सुरक्षित", text: "आपका डेटा सुरक्षित है" },
      { title: "विश्वसनीय मंदिर", text: "सत्यापित और प्रामाणिक मंदिर" },
      { title: "फोटो और वीडियो", text: "व्हाट्सऐप पर भेजे जाएंगे" },
      { title: "भक्ति पहले", text: "शुद्ध विधि, दिव्य आशीर्वाद" },
    ],
    detailsTitle: "भक्त विवरण भरें",
    detailsSubtitle: "पूजा बुक करने के लिए नीचे दिए गए विवरण भरें",
    loadingBookingDetails: "बुकिंग विवरण लोड हो रहा है",
    couldNotLoadBooking: "बुकिंग लोड नहीं हो सकी",
    poojaNotFound: "पूजा नहीं मिली।",
    backToPooja: "पूजा पर वापस जाएं",
    name: "नाम",
    namePlaceholder: "अपना नाम दर्ज करें",
    whatsappNumber: "व्हाट्सऐप नंबर",
    whatsappPlaceholder: "अपना व्हाट्सऐप नंबर दर्ज करें",
    whatsappVerified: "व्हाट्सऐप सत्यापित",
    verifyWhatsappNumber: "व्हाट्सऐप नंबर सत्यापित करें",
    whatsappReady: "आप लॉग इन हैं और आगे बढ़ सकते हैं।",
    whatsappOtpInfo: "सत्यापन के लिए आपके व्हाट्सऐप नंबर पर OTP भेजा जाएगा।",
    changeWhatsappNumber: "व्हाट्सऐप नंबर बदलें",
    sendOtp: "OTP भेजें",
    resendOtp: "OTP फिर भेजें",
    sending: "भेजा जा रहा है...",
    verifyAndLogin: "सत्यापित करें और लॉगिन करें",
    verifying: "सत्यापित हो रहा है...",
    state: "राज्य",
    selectState: "राज्य चुनें",
    nakshatra: "नक्षत्र",
    selectNakshatra: "नक्षत्र चुनें",
    naal: "दिन",
    gothra: "गोत्र",
    selectNaal: "दिन चुनें",
    enterGothra: "गोत्र दर्ज करें",
    sankalpa: "Sankalpa / Sankalpam",
    optional: "(वैकल्पिक)",
    sankalpaPlaceholder: "पूजा के लिए संकल्प विवरण दर्ज करें",
    prasadQuestion: "क्या आप पूजा का प्रसाद प्राप्त करना चाहते हैं?",
    yes: "हाँ",
    no: "नहीं",
    houseNo: "घर नंबर",
    houseNoPlaceholder: "घर नंबर / मंजिल नंबर दर्ज करें",
    gettingLocation: "स्थान प्राप्त हो रहा है...",
    useCurrentLocation: "वर्तमान स्थान का उपयोग करें",
    roadName: "सड़क / गली / लैंडमार्क",
    roadNamePlaceholder: "सड़क का नाम या लैंडमार्क दर्ज करें",
    pincode: "पिनकोड",
    pincodePlaceholder: "अपना पिनकोड दर्ज करें",
    district: "जिला",
    selectDistrict: "जिला चुनें",
    phoneNumber: "फोन नंबर",
    phoneNumberPlaceholder: "अपना मोबाइल नंबर दर्ज करें",
    completePayment: "भुगतान पूरा करें",
    bookingId: "बुकिंग आईडी",
    transactionId: "लेनदेन आईडी",
    backToDetails: "विवरण पर वापस जाएं",
    openingRazorpay: "Razorpay खुल रहा है...",
    proceedWithRazorpay: "Razorpay से आगे बढ़ें",
    bookingConfirmed: "बुकिंग पुष्टि हुई",
    viewMorePoojas: "और पूजाएँ देखें",
    bookingSummary: "बुकिंग सारांश",
    poojaDay: "पूजा दिन",
    planType: "योजना प्रकार",
    weeklyPlan: "साप्ताहिक योजना",
    singleDayPlan: "एक दिन की योजना",
    amount: "राशि",
    whatIsIncluded: "क्या शामिल है",
    prasadam: "प्रसाद",
    photosVideoWhatsapp: "व्हाट्सऐप पर फोटो और वीडियो",
    secureBooking: "सुरक्षित बुकिंग",
    informationSecure:
      "आपकी जानकारी सुरक्षित है और केवल पूजा के लिए उपयोग की जाएगी।",
    verifyWhatsappToContinue: "आगे बढ़ने के लिए व्हाट्सऐप सत्यापित करें",
    creatingBooking: "बुकिंग बनाई जा रही है...",
    continueToPayment: "भुगतान पर जाएं",
    paymentInProgress: "भुगतान जारी है",
    termsOfUse: "उपयोग की शर्तें",
    refundPolicy: "रिफंड और रद्दीकरण नीति",
    validationName: "अपना नाम दर्ज करें।",
    validationWhatsapp: "अपना व्हाट्सऐप नंबर दर्ज करें।",
    validationWhatsappVerify: "अपना व्हाट्सऐप नंबर सत्यापित करें।",
    validationState: "अपना राज्य चुनें।",
    validationNakshatra: "अपना नक्षत्र चुनें।",
    validationRoad: "सड़क का नाम या लैंडमार्क दर्ज करें।",
    validationPincode: "अपना पिनकोड दर्ज करें।",
    validationDistrict: "अपना जिला चुनें।",
    validationPhone: "अपना फोन नंबर दर्ज करें।",
  },
  ml: {
    ...bookingCopyEn,
    chooseOfferings: "സമർപ്പണങ്ങൾ തിരഞ്ഞെടുക്കുക",
    offeringsSubtitle:
      "ഈ പൂജയോടൊപ്പം ഉൾപ്പെടുത്തേണ്ട വഴിപാടുകൾ തിരഞ്ഞെടുക്കുക.",
    loadingOfferings: "സമർപ്പണങ്ങൾ ലോഡ് ചെയ്യുന്നു",
    retryOfferings: "വീണ്ടും ശ്രമിക്കുക",
    noOfferings: "ഈ പൂജയ്ക്ക് സമർപ്പണങ്ങളൊന്നും ലഭ്യമല്ല.",
    offering: "വഴിപാട്",
    dakshinaAmount: "ദക്ഷിണ തുക",
    dakshinaHelp:
      "ദക്ഷിണ ഐച്ഛികമാണ്, തിരഞ്ഞെടുത്ത വഴിപാടുകളിൽ നിന്ന് വേറിട്ടതാണ്.",
    continueToBooking: "തുടരുക",
    invalidDakshina: "ദക്ഷിണ തുക നെഗറ്റീവ് ആകരുത്.",
    offeringsUnavailable: "ഒരു സമർപ്പണങ്ങൾ ഇനി ലഭ്യമല്ല. പട്ടിക പുതുക്കി.",
    poojaPrice: "പൂജ നിരക്ക്",
    selectedOfferings: "തിരഞ്ഞെടുത്ത സമർപ്പണങ്ങൾ",
    offeringTotal: "വഴിപാടുകളുടെ ആകെ",
    dakshina: "ദക്ഷിണ",
    grandTotal: "ആകെ തുക",
    steps: [
      "വിവരങ്ങൾ നൽകുക",
      "പേയ്മെന്റ്",
      "ബുക്കിംഗ് സ്ഥിരീകരിച്ചു",
      "പൂജ നിശ്ചയിച്ചു",
      "പൂജ പൂർത്തിയായി",
    ],
    trustItems: [
      { title: "100% സുരക്ഷിതം", text: "നിങ്ങളുടെ ഡാറ്റ സുരക്ഷിതമാണ്" },
      {
        title: "വിശ്വസനീയ ക്ഷേത്രങ്ങൾ",
        text: "സ്ഥിരീകരിച്ച യഥാർത്ഥ ക്ഷേത്രങ്ങൾ",
      },
      { title: "ഫോട്ടോയും വീഡിയോയും", text: "വാട്സ്ആപ്പിൽ ലഭിക്കും" },
      { title: "ഭക്തി ആദ്യം", text: "ശുദ്ധമായ പൂജകൾ, ദിവ്യാനുഗ്രഹം" },
    ],
    detailsTitle: "ഭക്തന്റെ വിവരങ്ങൾ നൽകുക",
    detailsSubtitle: "പൂജ ബുക്ക് ചെയ്യാൻ താഴെയുള്ള വിവരങ്ങൾ നൽകുക",
    loadingBookingDetails: "ബുക്കിംഗ് വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു",
    couldNotLoadBooking: "ബുക്കിംഗ് ലോഡ് ചെയ്യാനായില്ല",
    poojaNotFound: "പൂജ കണ്ടെത്തിയില്ല.",
    backToPooja: "പൂജയിലേക്ക് മടങ്ങുക",
    name: "പേര്",
    namePlaceholder: "നിങ്ങളുടെ പേര് നൽകുക",
    whatsappNumber: "വാട്സ്ആപ്പ് നമ്പർ",
    whatsappPlaceholder: "നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പർ നൽകുക",
    whatsappVerified: "വാട്സ്ആപ്പ് സ്ഥിരീകരിച്ചു",
    verifyWhatsappNumber: "വാട്സ്ആപ്പ് നമ്പർ സ്ഥിരീകരിക്കുക",
    whatsappReady: "നിങ്ങൾ ലോഗിൻ ചെയ്തിട്ടുണ്ട്, തുടരാം.",
    whatsappOtpInfo:
      "സ്ഥിരീകരണത്തിനായി നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പറിലേക്ക് OTP അയയ്ക്കും.",
    changeWhatsappNumber: "വാട്സ്ആപ്പ് നമ്പർ മാറ്റുക",
    sendOtp: "OTP അയയ്ക്കുക",
    resendOtp: "OTP വീണ്ടും അയയ്ക്കുക",
    sending: "അയയ്ക്കുന്നു...",
    verifyAndLogin: "സ്ഥിരീകരിച്ച് ലോഗിൻ ചെയ്യുക",
    verifying: "സ്ഥിരീകരിക്കുന്നു...",
    state: "സംസ്ഥാനം",
    selectState: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക",
    nakshatra: "നക്ഷത്രം",
    selectNakshatra: "നക്ഷത്രം തിരഞ്ഞെടുക്കുക",
    naal: "നാൾ",
    gothra: "ഗോത്രം",
    selectNaal: "നാൾ തിരഞ്ഞെടുക്കുക",
    enterGothra: "ഗോത്രം നൽകുക",
    sankalpa: "സങ്കൽപം / Sankalpam",
    optional: "(ഓപ്ഷണൽ)",
    sankalpaPlaceholder: "പൂജയ്ക്കുള്ള സങ്കൽപ വിവരങ്ങൾ നൽകുക",
    prasadQuestion: "പൂജയുടെ പ്രസാദം ലഭിക്കണോ?",
    yes: "അതെ",
    no: "ഇല്ല",
    houseNo: "വീട് നമ്പർ",
    houseNoPlaceholder: "വീട് നമ്പർ / നില നമ്പർ നൽകുക",
    gettingLocation: "ലൊക്കേഷൻ ലഭിക്കുന്നു...",
    useCurrentLocation: "നിലവിലെ ലൊക്കേഷൻ ഉപയോഗിക്കുക",
    roadName: "റോഡ് / തെരുവ് / ലാൻഡ്മാർക്ക്",
    roadNamePlaceholder: "റോഡിന്റെ പേര് അല്ലെങ്കിൽ ലാൻഡ്മാർക്ക് നൽകുക",
    pincode: "പിൻകോഡ്",
    pincodePlaceholder: "നിങ്ങളുടെ പിൻകോഡ് നൽകുക",
    district: "ജില്ല",
    selectDistrict: "ജില്ല തിരഞ്ഞെടുക്കുക",
    phoneNumber: "ഫോൺ നമ്പർ",
    phoneNumberPlaceholder: "നിങ്ങളുടെ മൊബൈൽ നമ്പർ നൽകുക",
    completePayment: "പേയ്മെന്റ് പൂർത്തിയാക്കുക",
    bookingId: "ബുക്കിംഗ് ഐഡി",
    transactionId: "ട്രാൻസാക്ഷൻ ഐഡി",
    backToDetails: "വിവരങ്ങളിലേക്ക് മടങ്ങുക",
    openingRazorpay: "Razorpay തുറക്കുന്നു...",
    proceedWithRazorpay: "Razorpay വഴി തുടരുക",
    bookingConfirmed: "ബുക്കിംഗ് സ്ഥിരീകരിച്ചു",
    viewMorePoojas: "കൂടുതൽ പൂജകൾ കാണുക",
    bookingSummary: "ബുക്കിംഗ് സംഗ്രഹം",
    poojaDay: "പൂജ ദിവസം",
    planType: "പ്ലാൻ തരം",
    weeklyPlan: "ആഴ്ച്ച പ്ലാൻ",
    singleDayPlan: "ഒരുദിവസ പ്ലാൻ",
    amount: "തുക",
    whatIsIncluded: "ഉൾപ്പെടുന്നത്",
    prasadam: "പ്രസാദം",
    photosVideoWhatsapp: "വാട്സ്ആപ്പിൽ ഫോട്ടോയും വീഡിയോയും",
    secureBooking: "സുരക്ഷിത ബുക്കിംഗ്",
    informationSecure:
      "നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമാണ്, പൂജ ആവശ്യത്തിനായി മാത്രം ഉപയോഗിക്കും.",
    verifyWhatsappToContinue: "തുടരാൻ വാട്സ്ആപ്പ് സ്ഥിരീകരിക്കുക",
    creatingBooking: "ബുക്കിംഗ് സൃഷ്ടിക്കുന്നു...",
    continueToPayment: "പേയ്മെന്റിലേക്ക് തുടരുക",
    paymentInProgress: "പേയ്മെന്റ് പുരോഗമിക്കുന്നു",
    termsOfUse: "ഉപയോഗ നിബന്ധനകൾ",
    refundPolicy: "റിഫണ്ട് & റദ്ദാക്കൽ നയം",
    validationName: "നിങ്ങളുടെ പേര് നൽകുക.",
    validationWhatsapp: "നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പർ നൽകുക.",
    validationWhatsappVerify: "നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പർ സ്ഥിരീകരിക്കുക.",
    validationState: "നിങ്ങളുടെ സംസ്ഥാനം തിരഞ്ഞെടുക്കുക.",
    validationNakshatra: "നിങ്ങളുടെ നക്ഷത്രം തിരഞ്ഞെടുക്കുക.",
    validationRoad: "റോഡിന്റെ പേര് അല്ലെങ്കിൽ ലാൻഡ്മാർക്ക് നൽകുക.",
    validationPincode: "നിങ്ങളുടെ പിൻകോഡ് നൽകുക.",
    validationDistrict: "നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക.",
    validationPhone: "നിങ്ങളുടെ ഫോൺ നമ്പർ നൽകുക.",
  },
  mr: {
    ...bookingCopyEn,
    chooseOfferings: "अर्पण निवडा",
    offeringsSubtitle: "या पूजेसोबत समाविष्ट करायची अर्पणे निवडा.",
    loadingOfferings: "अर्पणे लोड होत आहेत",
    retryOfferings: "पुन्हा प्रयत्न करा",
    noOfferings: "या पूजेसाठी कोणतीही अर्पणे उपलब्ध नाहीत.",
    offering: "अर्पण",
    dakshinaAmount: "दक्षिणा रक्कम",
    dakshinaHelp: "दक्षिणा ऐच्छिक असून निवडलेल्या अर्पणांपासून स्वतंत्र आहे.",
    continueToBooking: "पुढे जा",
    invalidDakshina: "दक्षिणा रक्कम ऋण असू शकत नाही.",
    offeringsUnavailable: "एक अर्पण आता उपलब्ध नाही. यादी रिफ्रेश केली आहे.",
    poojaPrice: "पूजा किंमत",
    selectedOfferings: "निवडलेली अर्पणे",
    offeringTotal: "अर्पण एकूण",
    dakshina: "दक्षिणा",
    grandTotal: "एकूण रक्कम",
    steps: [
      "तपशील भरा",
      "पेमेंट",
      "बुकिंग पुष्टी",
      "पूजा नियोजित",
      "पूजा पूर्ण",
    ],
    detailsTitle: "भक्त तपशील भरा",
    detailsSubtitle: "पूजा बुक करण्यासाठी खालील तपशील द्या",
    name: "नाव",
    namePlaceholder: "तुमचे नाव भरा",
    whatsappNumber: "व्हॉट्सअॅप नंबर",
    whatsappPlaceholder: "तुमचा व्हॉट्सअॅप नंबर भरा",
    whatsappVerified: "व्हॉट्सअॅप पडताळले",
    verifyWhatsappNumber: "व्हॉट्सअॅप नंबर पडताळा",
    changeWhatsappNumber: "व्हॉट्सअॅप नंबर बदला",
    state: "राज्य",
    selectState: "राज्य निवडा",
    nakshatra: "नक्षत्र",
    selectNakshatra: "नक्षत्र निवडा",
    naal: "दिवस",
    gothra: "गोत्र",
    selectNaal: "दिवस निवडा",
    enterGothra: "गोत्र भरा",
    sankalpa: "Sankalpa / Sankalpam",
    optional: "(ऐच्छिक)",
    sankalpaPlaceholder: "पूजेसाठी संकल्प तपशील भरा",
    prasadQuestion: "तुम्हाला पूजेचा प्रसाद घ्यायचा आहे का?",
    yes: "होय",
    no: "नाही",
    houseNo: "घर क्रमांक",
    houseNoPlaceholder: "घर क्रमांक / मजला क्रमांक भरा",
    useCurrentLocation: "सध्याचे लोकेशन वापरा",
    roadName: "रस्ता / गल्ली / लँडमार्क",
    roadNamePlaceholder: "रस्त्याचे नाव किंवा लँडमार्क भरा",
    pincode: "पिनकोड",
    pincodePlaceholder: "तुमचा पिनकोड भरा",
    district: "जिल्हा",
    selectDistrict: "जिल्हा निवडा",
    phoneNumber: "फोन नंबर",
    phoneNumberPlaceholder: "तुमचा मोबाईल नंबर भरा",
    completePayment: "पेमेंट पूर्ण करा",
    bookingConfirmed: "बुकिंग पुष्टी झाली",
    bookingSummary: "बुकिंग सारांश",
    poojaDay: "पूजा दिवस",
    planType: "योजना प्रकार",
    amount: "रक्कम",
    continueToPayment: "पेमेंटकडे जा",
    verifyWhatsappToContinue: "पुढे जाण्यासाठी व्हॉट्सअॅप पडताळा",
    creatingBooking: "बुकिंग तयार होत आहे...",
    paymentInProgress: "पेमेंट सुरू आहे",
    termsOfUse: "वापर अटी",
    refundPolicy: "रिफंड आणि रद्द धोरण",
  },
  ta: {
    ...bookingCopyEn,
    chooseOfferings: "காணிக்கைகளைத் தேர்ந்தெடுக்கவும்",
    offeringsSubtitle:
      "இந்த பூஜையுடன் சேர்க்க வேண்டிய காணிக்கைகளைத் தேர்ந்தெடுக்கவும்.",
    loadingOfferings: "காணிக்கைகள் ஏற்றப்படுகின்றன",
    retryOfferings: "மீண்டும் முயற்சிக்கவும்",
    noOfferings: "இந்த பூஜைக்கு காணிக்கைகள் எதுவும் கிடைக்கவில்லை.",
    offering: "காணிக்கை",
    dakshinaAmount: "தட்சிணை தொகை",
    dakshinaHelp:
      "தட்சிணை விருப்பமானது; தேர்ந்தெடுத்த காணிக்கைகளிலிருந்து தனியானது.",
    continueToBooking: "தொடரவும்",
    invalidDakshina: "தட்சிணை தொகை எதிர்மறையாக இருக்கக்கூடாது.",
    offeringsUnavailable:
      "ஒரு காணிக்கை இப்போது கிடைக்கவில்லை. பட்டியல் புதுப்பிக்கப்பட்டது.",
    poojaPrice: "பூஜை விலை",
    selectedOfferings: "தேர்ந்தெடுத்த காணிக்கைகள்",
    offeringTotal: "காணிக்கை மொத்தம்",
    dakshina: "தட்சிணை",
    grandTotal: "மொத்தத் தொகை",
    steps: [
      "விவரங்களை உள்ளிடவும்",
      "கட்டணம்",
      "பதிவு உறுதி",
      "பூஜை திட்டமிடப்பட்டது",
      "பூஜை முடிந்தது",
    ],
    detailsTitle: "பக்தர் விவரங்களை உள்ளிடவும்",
    detailsSubtitle: "பூஜையை பதிவு செய்ய கீழே உள்ள விவரங்களை வழங்கவும்",
    name: "பெயர்",
    namePlaceholder: "உங்கள் பெயரை உள்ளிடவும்",
    whatsappNumber: "வாட்ஸ்அப் எண்",
    whatsappPlaceholder: "உங்கள் வாட்ஸ்அப் எண்ணை உள்ளிடவும்",
    whatsappVerified: "வாட்ஸ்அப் சரிபார்க்கப்பட்டது",
    verifyWhatsappNumber: "வாட்ஸ்அப் எண்ணை சரிபார்க்கவும்",
    changeWhatsappNumber: "வாட்ஸ்அப் எண்ணை மாற்றவும்",
    state: "மாநிலம்",
    selectState: "மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
    nakshatra: "நட்சத்திரம்",
    selectNakshatra: "நட்சத்திரத்தைத் தேர்ந்தெடுக்கவும்",
    naal: "நாள்",
    gothra: "கோத்திரம்",
    selectNaal: "நாளைத் தேர்ந்தெடுக்கவும்",
    enterGothra: "கோத்திரத்தை உள்ளிடவும்",
    sankalpa: "சங்கல்பம் / Sankalpam",
    optional: "(விருப்பம்)",
    sankalpaPlaceholder: "பூஜைக்கான சங்கல்ப விவரங்களை உள்ளிடவும்",
    prasadQuestion: "பூஜைக்கான பிரசாதம் பெற விரும்புகிறீர்களா?",
    yes: "ஆம்",
    no: "இல்லை",
    houseNo: "வீட்டு எண்",
    houseNoPlaceholder: "வீட்டு எண் / மாடி எண்ணை உள்ளிடவும்",
    useCurrentLocation: "தற்போதைய இருப்பிடத்தைப் பயன்படுத்து",
    roadName: "சாலை / தெரு / அடையாளம்",
    roadNamePlaceholder: "சாலை பெயர் அல்லது அடையாளத்தை உள்ளிடவும்",
    pincode: "பின்கோடு",
    pincodePlaceholder: "உங்கள் பின்கோடை உள்ளிடவும்",
    district: "மாவட்டம்",
    selectDistrict: "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    phoneNumber: "தொலைபேசி எண்",
    phoneNumberPlaceholder: "உங்கள் மொபைல் எண்ணை உள்ளிடவும்",
    completePayment: "கட்டணத்தை முடிக்கவும்",
    bookingConfirmed: "பதிவு உறுதி செய்யப்பட்டது",
    bookingSummary: "பதிவு சுருக்கம்",
    poojaDay: "பூஜை நாள்",
    planType: "திட்ட வகை",
    amount: "தொகை",
    continueToPayment: "கட்டணத்திற்கு தொடரவும்",
    verifyWhatsappToContinue: "தொடர வாட்ஸ்அப்பை சரிபார்க்கவும்",
    creatingBooking: "பதிவு உருவாக்கப்படுகிறது...",
    paymentInProgress: "கட்டணம் நடைபெறுகிறது",
    termsOfUse: "பயன்பாட்டு விதிமுறைகள்",
    refundPolicy: "ரீபண்ட் & ரத்து கொள்கை",
  },
};
