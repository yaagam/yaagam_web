"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { City, State } from "country-state-city";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Heart,
  Home,
  Lock,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

import { LanguageSelector } from "@/components/ui/language-selector";
import { BookingPaymentPage } from "@/components/blocks/pooja-booking/BookingPaymentPage";
import { BookingSuccessModal } from "@/components/blocks/pooja-booking/BookingSuccessModal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES, PLACEHOLDER_ROUTE } from "@/constants/route.const";
import type { Pooja, PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { TempleTranslation } from "@/lib/api/admin/temple/temples.api";
import { getPoojaDetailsApi } from "@/lib/api/pooja/poojas.api";
import apiClient, { refreshAuthSession } from "@/lib/api/axios/axios.instance";
import { sendOtpApi } from "@/lib/api/user/send-otp.api";
import { verifyOtpApi } from "@/lib/api/user/verify-otp.api";
import { useToast } from "@/components/providers/ToastProvider";
import {
  getClientWhatsappNumber,
  isClientLoggedIn,
  markClientLoggedIn,
  markClientWhatsappNumber,
} from "@/lib/auth/client-session";
import type { UserRole } from "@/lib/auth/roles";
import { getErrorMessage } from "@/lib/utils";

type PoojaBookingViewProps = {
  poojaId: string;
  plan?: string;
};

type DbLanguage = PoojaTranslation["language"];

const dbLanguageByAppLanguage: Record<string, DbLanguage> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};
type CheckoutStep = "details" | "payment" | "success";
type PaymentMode = "autopay" | "qr" | "card" | "netbanking";

type PaymentSession = {
  bookingId: string;
  transactionId: string;
  keyId?: string;
  amount: number;
  currency: string;
  gatewayMode: "order" | "subscription" | "autopay-qr";
  orderId?: string;
  subscriptionId?: string;
  razorpayAutoPayQrId?: string;
  qrImageUrl?: string;
  gatewayReference: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
};

type CurrentLocationAddress = {
  latitude: number;
  longitude: number;
  houseNo?: string;
  streetName: string;
  state?: string;
  pincode?: string;
  district?: string;
};

type BookingForm = {
  name: string;
  whatsappNumber: string;
  state: string;
  nakshatra: string;
  naal: string;
  specialRequest: string;
  wantsPrasad: boolean;
  houseNo: string;
  streetName: string;
  pincode: string;
  district: string;
  phoneNumber: string;
};

type AddressSnapshot = {
  houseNo?: string;
  streetName: string;
  pincode: string;
  district: string;
  phoneNumber: string;
  state?: string;
  location?: string;
};

type SavedAddress = Partial<AddressSnapshot> & {
  roadName?: string;
  houseNumber?: string;
};

const southIndianStates = new Set([
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Lakshadweep",
  "Puducherry",
  "Tamil Nadu",
  "Telangana",
]);

const nakshatras = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashirsha",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const naalOptions = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const indianStates = State.getStatesOfCountry("IN");
const SESSION_EXPIRED_ERROR = "Session Expired";

type BookingCopy = {
  steps: string[];
  trustItems: Array<{ title: string; text: string }>;
  detailsTitle: string;
  detailsSubtitle: string;
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
  specialRequest: string;
  optional: string;
  specialRequestPlaceholder: string;
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
  steps: ["Enter Details", "Payment", "Booking Confirmed", "Pooja Scheduled", "Pooja Completed"],
  trustItems: [
    { title: "100% Secure", text: "Your data is safe with us" },
    { title: "Trusted Temples", text: "Verified & authentic temples" },
    { title: "Photos & Videos", text: "Delivered on WhatsApp" },
    { title: "Devotion First", text: "Pure rituals, divine blessings" },
  ],
  detailsTitle: "Enter Devotee Details",
  detailsSubtitle: "Please provide the details below to book your pooja",
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
  whatsappOtpInfo: "We will send an OTP to your WhatsApp number for verification.",
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
  specialRequest: "Special Request",
  optional: "(Optional)",
  specialRequestPlaceholder: "Any specific request for the pooja",
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
  paymentSubtitle: "Select a payment mode. The backend has already created the payment reference for this booking.",
  bookingId: "Booking ID",
  transactionId: "Transaction ID",
  razorpayAutoPayQrId: "Razorpay AutoPay QR ID",
  googlePayAutoPayQr: "Google Pay AutoPay QR",
  weeklyQrText: "Weekly plan shows only the backend-provided AutoPay QR id. Later this will map to Razorpay AutoPay.",
  qrUpi: "QR / UPI",
  card: "Card",
  netbanking: "Netbanking",
  razorpayCheckoutOption: "Backend payment reference",
  backToDetails: "Back to Details",
  openingRazorpay: "Confirming payment...",
  proceedWithRazorpay: "I have completed payment",
  bookingConfirmed: "Booking Confirmed",
  bookingConfirmedText: "Your booking and transaction are successful. This screen is shown only after backend payment verification succeeds.",
  viewMorePoojas: "View More Poojas",
  bookingSummary: "Booking Summary",
  poojaDay: "Pooja Day",
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
  informationSecure: "Your information is secure and will only be used for pooja purpose.",
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

const bookingCopy: Record<string, BookingCopy> = {
  en: bookingCopyEn,
  hi: {
    ...bookingCopyEn,
    steps: ["विवरण भरें", "भुगतान", "बुकिंग पुष्टि", "पूजा निर्धारित", "पूजा पूर्ण"],
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
    specialRequest: "विशेष अनुरोध",
    optional: "(वैकल्पिक)",
    specialRequestPlaceholder: "पूजा के लिए कोई विशेष अनुरोध",
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
    informationSecure: "आपकी जानकारी सुरक्षित है और केवल पूजा के लिए उपयोग की जाएगी।",
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
    steps: ["വിവരങ്ങൾ നൽകുക", "പേയ്മെന്റ്", "ബുക്കിംഗ് സ്ഥിരീകരിച്ചു", "പൂജ നിശ്ചയിച്ചു", "പൂജ പൂർത്തിയായി"],
    trustItems: [
      { title: "100% സുരക്ഷിതം", text: "നിങ്ങളുടെ ഡാറ്റ സുരക്ഷിതമാണ്" },
      { title: "വിശ്വസനീയ ക്ഷേത്രങ്ങൾ", text: "സ്ഥിരീകരിച്ച യഥാർത്ഥ ക്ഷേത്രങ്ങൾ" },
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
    whatsappOtpInfo: "സ്ഥിരീകരണത്തിനായി നിങ്ങളുടെ വാട്സ്ആപ്പ് നമ്പറിലേക്ക് OTP അയയ്ക്കും.",
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
    specialRequest: "പ്രത്യേക അഭ്യർത്ഥന",
    optional: "(ഓപ്ഷണൽ)",
    specialRequestPlaceholder: "പൂജയ്ക്കുള്ള പ്രത്യേക അഭ്യർത്ഥന നൽകുക",
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
    informationSecure: "നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമാണ്, പൂജ ആവശ്യത്തിനായി മാത്രം ഉപയോഗിക്കും.",
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
    steps: ["तपशील भरा", "पेमेंट", "बुकिंग पुष्टी", "पूजा नियोजित", "पूजा पूर्ण"],
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
    specialRequest: "विशेष विनंती",
    optional: "(ऐच्छिक)",
    specialRequestPlaceholder: "पूजेसाठी काही विशेष विनंती असल्यास भरा",
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
    steps: ["விவரங்களை உள்ளிடவும்", "கட்டணம்", "பதிவு உறுதி", "பூஜை திட்டமிடப்பட்டது", "பூஜை முடிந்தது"],
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
    specialRequest: "சிறப்பு கோரிக்கை",
    optional: "(விருப்பம்)",
    specialRequestPlaceholder: "பூஜைக்கு ஏதேனும் சிறப்பு கோரிக்கை இருந்தால் உள்ளிடவும்",
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
const trustItemIcons = [Lock, MapPin, Camera, Heart];

function getApiUrl(path: string, apiBaseUrl: string) {
  const normalizedBaseUrl = apiBaseUrl.endsWith("/")
    ? apiBaseUrl
    : `${apiBaseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, "");

  return new URL(normalizedPath, normalizedBaseUrl);
}

function getBrowserPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Current location is not supported on this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12000,
    });
  });
}

function isCurrentLocationAddress(
  value: unknown,
): value is CurrentLocationAddress {
  if (!value || typeof value !== "object") return false;

  const address = value as Partial<CurrentLocationAddress>;

  return (
    typeof address.latitude === "number" &&
    typeof address.longitude === "number" &&
    typeof address.streetName === "string"
  );
}

async function getCurrentLocationAddress(): Promise<CurrentLocationAddress> {
  console.info("[location] requesting browser position");
  const position = await getBrowserPosition();
  const latitude = Number(position.coords.latitude.toFixed(6));
  const longitude = Number(position.coords.longitude.toFixed(6));
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    console.error("[location] NEXT_PUBLIC_API_URL is not configured");
    throw new Error("Location service is not configured.");
  }

  const requestUrl = getApiUrl("addresses/reverse-geocode", apiBaseUrl);
  requestUrl.searchParams.set("latitude", latitude.toString());
  requestUrl.searchParams.set("longitude", longitude.toString());

  console.info("[location] calling backend reverse geocode", {
    latitude,
    longitude,
    url: requestUrl.toString(),
  });

  const response = await fetch(requestUrl, {
    method: "GET",
    credentials: "include",
  });

  const responseData = await response.json().catch((parseError: unknown) => {
    console.error("[location] unable to parse backend response", parseError);
    return null;
  });
  const data =
    responseData && typeof responseData === "object" && "data" in responseData
      ? (responseData as { data?: unknown }).data
      : responseData;

  console.info("[location] backend reverse geocode response", {
    ok: response.ok,
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Unable to fetch address from current location."),
    );
  }

  const address = data as {
    houseNo?: unknown;
    houseNumber?: unknown;
    roadName?: unknown;
    formattedAddress?: unknown;
    state?: unknown;
    pincode?: unknown;
    district?: unknown;
  };
  const houseNo =
    typeof address.houseNo === "string" && address.houseNo
      ? address.houseNo
      : typeof address.houseNumber === "string"
        ? address.houseNumber
        : undefined;
  const streetName =
    typeof address.roadName === "string" && address.roadName
      ? address.roadName
      : typeof address.formattedAddress === "string"
        ? address.formattedAddress
        : "";

  const mappedAddress: CurrentLocationAddress = {
    latitude,
    longitude,
    houseNo,
    streetName,
    state: typeof address.state === "string" ? address.state : undefined,
    pincode: typeof address.pincode === "string" ? address.pincode : undefined,
    district:
      typeof address.district === "string" ? address.district : undefined,
  };

  if (!isCurrentLocationAddress(mappedAddress)) {
    console.error("[location] backend returned invalid address", data);
    throw new Error("Location service returned an invalid address.");
  }

  return mappedAddress;
}

function getApiResponsePayload(responseData: unknown) {
  return responseData && typeof responseData === "object" && "data" in responseData
    ? (responseData as { data?: unknown }).data
    : responseData;
}

function getApiRequestErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    const data = getApiResponsePayload(responseData);

    return getErrorMessage(data ?? responseData ?? error, fallback);
  }

  return getErrorMessage(error, fallback);
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSavedAddress(value: unknown): value is SavedAddress {
  return Boolean(value && typeof value === "object");
}

function mapSavedAddress(value: unknown): SavedAddress | null {
  const data = getApiResponsePayload(value);
  const address = Array.isArray(data) ? data[0] : data;

  if (!isSavedAddress(address)) return null;

  const mappedAddress: SavedAddress = {
    houseNo:
      getStringValue(address.houseNo) || getStringValue(address.houseNumber),
    streetName:
      getStringValue(address.streetName) || getStringValue(address.roadName),
    pincode: getStringValue(address.pincode),
    district: getStringValue(address.district),
    phoneNumber: getStringValue(address.phoneNumber),
    state: getStringValue(address.state),
    location: getStringValue(address.location),
  };

  return Object.values(mappedAddress).some(Boolean) ? mappedAddress : null;
}

async function getSavedAddress() {
  try {
    const response = await apiClient.get("/addresses/me");

    return mapSavedAddress(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    console.error("[address] unable to load saved address", error);
    return null;
  }
}

async function replaceSavedAddress(address: AddressSnapshot) {
  try {
    await apiClient.put("/addresses/me", address);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await apiClient.post("/addresses", address);
      return;
    }

    console.error("[address] unable to replace saved address", error);
  }
}

function createAddressSnapshot(form: BookingForm): AddressSnapshot | null {
  if (!form.wantsPrasad) return null;

  const streetName = form.streetName.trim();
  const pincode = form.pincode.trim();
  const district = form.district.trim();
  const phoneNumber = form.phoneNumber.trim();

  if (!streetName || !pincode || !district || !phoneNumber) return null;

  return {
    houseNo: form.houseNo.trim() || undefined,
    streetName,
    pincode,
    district,
    phoneNumber,
    state: form.state.trim() || undefined,
    location: streetName.startsWith("Current location:")
      ? streetName.replace("Current location:", "").trim()
      : undefined,
  };
}

function mergeSavedAddressIntoEmptyFields(
  current: BookingForm,
  savedAddress: SavedAddress,
): BookingForm {
  return {
    ...current,
    state: current.state || savedAddress.state || "",
    houseNo: current.houseNo || savedAddress.houseNo || "",
    streetName: current.streetName || savedAddress.streetName || "",
    pincode: current.pincode || savedAddress.pincode || "",
    district: current.district || savedAddress.district || "",
    phoneNumber: current.phoneNumber || savedAddress.phoneNumber || "",
  };
}

function isPaymentSession(value: unknown): value is PaymentSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<PaymentSession>;

  return (
    typeof session.bookingId === "string" &&
    typeof session.transactionId === "string" &&
    typeof session.amount === "number" &&
    typeof session.currency === "string" &&
    typeof session.gatewayReference === "string" &&
    (session.gatewayMode === "order" ||
      session.gatewayMode === "subscription" ||
      session.gatewayMode === "autopay-qr")
  );
}

async function createBackendPaymentSession(payload: unknown) {
  try {
    const response = await apiClient.post("/bookings/checkout-session", payload);
    const data = getApiResponsePayload(response.data);

    if (!isPaymentSession(data)) {
      throw new Error("Payment service returned an invalid checkout session.");
    }

    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("[checkout] create session failed", {
        status: error.response?.status,
        responseData: error.response?.data,
      });
    }

    throw new Error(
      getApiRequestErrorMessage(
        error,
        "Unable to create Razorpay checkout session.",
      ),
    );
  }
}
const defaultForm: BookingForm = {
  name: "",
  whatsappNumber: "",
  state: "",
  nakshatra: "",
  naal: "",
  specialRequest: "",
  wantsPrasad: true,
  houseNo: "",
  streetName: "",
  pincode: "",
  district: "",
  phoneNumber: "",
};

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

function getApiImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return "";
  if (/^(?:https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (!imageUrl.startsWith("/")) return imageUrl;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return imageUrl;

  try {
    return new URL(imageUrl, apiBaseUrl).toString();
  } catch {
    return imageUrl;
  }
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

function getNextPoojaDate(dayName: string) {
  const targetDay = naalOptions.findIndex(
    (day) => day.toLowerCase() === dayName.toLowerCase(),
  );

  if (targetDay === -1) return dayName;

  const today = new Date();
  const daysUntil = (targetDay - today.getDay() + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(nextDate);
}

function inputClassName(isInvalid = false) {
  return [
    "mt-1 h-10 rounded-md bg-white px-4 text-[12px] shadow-none outline-none transition placeholder:text-[#667399]",
    isInvalid
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-[#d9e0ed] focus:border-saffron focus:ring-2 focus:ring-saffron/10",
  ].join(" ");
}

function selectClassName(value: string, isInvalid = false) {
  return [
    "mt-1 h-10 w-full rounded-md border bg-white px-4 text-[12px] font-semibold outline-none transition",
    isInvalid
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-[#d9e0ed] focus:border-saffron focus:ring-2 focus:ring-saffron/10",
    value ? "text-[#061b4d]" : "text-[#667399]",
  ].join(" ");
}

function getStateIsoCode(stateName: string) {
  return indianStates.find((state) => state.name === stateName)?.isoCode ?? "";
}

function FieldLabel({
  children,
  required,
}: Readonly<{ children: React.ReactNode; required?: boolean }>) {
  return (
    <span className="text-[12px] font-extrabold text-[#061b4d]">
      {children} {required && <span className="text-[#ef7d1a]">*</span>}
    </span>
  );
}

export function PoojaBookingView({ poojaId, plan }: PoojaBookingViewProps) {
  const [pooja, setPooja] = useState<Pooja | null>(null);
  const [form, setForm] = useState<BookingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [isChangingWhatsappNumber, setIsChangingWhatsappNumber] =
    useState(false);
  const [hasTriedContinue, setHasTriedContinue] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("details");
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<PaymentMode | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasLoadedSavedAddress, setHasLoadedSavedAddress] = useState(false);

  const bookingText = bookingCopy[language] ?? bookingCopy.en;
  const dbLanguage = dbLanguageByAppLanguage[language] ?? "EN";

  useEffect(() => {
    let isActive = true;

    const timer = window.setTimeout(() => {
      const isLoggedIn = isClientLoggedIn();
      const storedWhatsappNumber = getClientWhatsappNumber();

      setIsWhatsappVerified(isLoggedIn);

      if (isLoggedIn && storedWhatsappNumber) {
        setForm((current) => ({
          ...current,
          whatsappNumber: current.whatsappNumber || storedWhatsappNumber,
        }));
      }

      if (isLoggedIn) {
        void prefillSavedAddressIfEmpty();
      }
    }, 0);

    async function prefillSavedAddressIfEmpty() {
      if (hasLoadedSavedAddress) return;

      const savedAddress = await getSavedAddress();
      if (!isActive) return;

      setHasLoadedSavedAddress(true);

      if (!savedAddress) return;

      setForm((current) =>
        mergeSavedAddressIntoEmptyFields(current, savedAddress),
      );
    }

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [hasLoadedSavedAddress]);

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
        setError(getErrorMessage(loadError, bookingText.couldNotLoadBooking));
        setPooja(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPooja();

    return () => {
      isActive = false;
    };
  }, [bookingText.couldNotLoadBooking, poojaId]);

  const summary = useMemo(() => {
    if (!pooja) return null;

    const poojaTranslation = getLocalizedTranslation<PoojaTranslation>(
      pooja.translations,
      dbLanguage,
    );
    const templeTranslation = getLocalizedTranslation<TempleTranslation>(
      pooja.temple?.translations,
      dbLanguage,
    );
    const selectedPlan = plan === "weekly" ? "weekly" : "single";
    const amount =
      selectedPlan === "weekly"
        ? getDiscountedAmount(pooja.baseAmount, pooja.weeklyDiscount)
        : getDiscountedAmount(pooja.baseAmount, pooja.normalDiscount);
    const image = getApiImageUrl(pooja.imageUrls?.[0] ?? "/nava_graha.png");

    return {
      title: poojaTranslation?.name ?? "Pooja",
      templeName: templeTranslation?.name ?? "Temple",
      templePlace: templeTranslation?.place ?? "",
      poojaDay: pooja.poojaDay,
      nextDate: getNextPoojaDate(pooja.poojaDay),
      planName:
        selectedPlan === "weekly"
          ? bookingText.weeklyPlan
          : bookingText.singleDayPlan,
      amount,
      image,
    };
  }, [bookingText.singleDayPlan, bookingText.weeklyPlan, dbLanguage, plan, pooja]);

  const selectedPlan = plan === "weekly" ? "weekly" : "single";
  const activeStepIndex =
    checkoutStep === "details" ? 0 : checkoutStep === "payment" ? 1 : 2;
  const isSouthState = southIndianStates.has(form.state);
  const naalFieldLabel = isSouthState ? bookingText.naal : bookingText.gothra;
  const stateIsoCode = getStateIsoCode(form.state);
  const districts = useMemo(() => {
    if (!stateIsoCode) return form.district ? [form.district] : [];

    const stateDistricts = Array.from(
      new Set(
        City.getCitiesOfState("IN", stateIsoCode).map((city) => city.name),
      ),
    );

    if (form.district && !stateDistricts.includes(form.district)) {
      stateDistricts.push(form.district);
    }

    return stateDistricts.sort((first, second) =>
      first.localeCompare(second),
    );
  }, [form.district, stateIsoCode]);

  const addressSnapshot = useMemo(() => createAddressSnapshot(form), [form]);

  const bookingPayload = useMemo(
    () => ({
      poojaId,
      plan: selectedPlan,
      devotee: {
        name: form.name.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        state: form.state.trim(),
        nakshatra: form.nakshatra.trim(),
        naal: form.naal.trim(),
        specialRequest: form.specialRequest.trim(),
      },
      address: addressSnapshot,
      addressSnapshot,
    }),
    [addressSnapshot, form, poojaId, selectedPlan],
  );

  async function getRoleAfterLogin(fallbackRole: UserRole | null) {
    if (fallbackRole) return fallbackRole;

    try {
      return await refreshAuthSession();
    } catch {
      return null;
    }
  }

  function handleWhatsAppNumberChange(value: string) {
    setForm((current) => ({
      ...current,
      whatsappNumber: value.replace(/\D/g, "").slice(0, 10),
    }));
    setOtp("");
    setOtpSent(false);
    setOtpError("");
    if (!isClientLoggedIn()) setIsWhatsappVerified(false);
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setOtpError("");
  }

  async function requestBookingOtp() {
    if (!/^[6-9]\d{9}$/.test(form.whatsappNumber)) {
      setOtpError(bookingText.validWhatsappError);
      return;
    }

    if (isClientLoggedIn() && !isChangingWhatsappNumber) {
      setIsWhatsappVerified(true);
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");

    try {
      await sendOtpApi(form.whatsappNumber);
      setOtpSent(true);
      setOtp("");
      showToast("success", bookingText.otpSent);
    } catch (sendError: unknown) {
      setOtpError(
        getErrorMessage(sendError, bookingText.sendOtpError),
      );
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function verifyBookingOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError(bookingText.otpCodeError);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const authResult = await verifyOtpApi(otp);
      const role = await getRoleAfterLogin(authResult.role);

      if (!role) throw new Error(bookingText.loginError);

      markClientWhatsappNumber(form.whatsappNumber);
      markClientLoggedIn(role);
      setIsWhatsappVerified(true);
      setIsChangingWhatsappNumber(false);
      setOtpSent(false);
      const savedAddress = await getSavedAddress();
      setHasLoadedSavedAddress(true);
      if (savedAddress) {
        setForm((current) =>
          mergeSavedAddressIntoEmptyFields(current, savedAddress),
        );
      }
      setOtp("");
      showToast("success", bookingText.whatsappSuccess);
    } catch (verifyError: unknown) {
      const message = getErrorMessage(
        verifyError,
        bookingText.sendOtpError,
      );

      if (message === SESSION_EXPIRED_ERROR) {
        setOtpSent(false);
        setOtp("");
        setOtpError(bookingText.otpRetry);
        return;
      }

      setOtpError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  }
  function handleChangeWhatsappNumber() {
    setIsChangingWhatsappNumber(true);
    setIsWhatsappVerified(false);
    setOtp("");
    setOtpSent(false);
    setOtpError("");
  }

  function updateField<K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUseCurrentLocation() {
    setIsDetectingLocation(true);
    setLocationError("");

    try {
      const location = await getCurrentLocationAddress();
      setForm((current) => ({
        ...current,
        state: location.state ?? current.state,
        houseNo: location.houseNo ?? current.houseNo,
        streetName: location.streetName,
        pincode: location.pincode ?? current.pincode,
        district: location.district ?? current.district,
      }));
      showToast("success", bookingText.currentLocationAdded);
    } catch (locationRequestError: unknown) {
      console.error(
        "[location] use current location failed",
        locationRequestError,
      );
      setLocationError(
        getErrorMessage(
          locationRequestError,
          bookingText.locationError,
        ),
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }
  function isRequiredFieldInvalid(value: string) {
    return hasTriedContinue && !value.trim();
  }

  function getBookingValidationError() {
    if (!form.name.trim()) return bookingText.validationName;
    if (!form.whatsappNumber.trim()) return bookingText.validationWhatsapp;
    if (!isWhatsappVerified) return bookingText.validationWhatsappVerify;
    if (!form.state.trim()) return bookingText.validationState;
    if (!form.nakshatra.trim()) return bookingText.validationNakshatra;
    if (!form.naal.trim()) {
      return isSouthState
        ? bookingText.selectNaal
        : bookingText.enterGothra;
    }

    if (form.wantsPrasad) {
      if (!form.streetName.trim()) return bookingText.validationRoad;
      if (!form.pincode.trim()) return bookingText.validationPincode;
      if (!form.district.trim()) return bookingText.validationDistrict;
      if (!form.phoneNumber.trim()) return bookingText.validationPhone;
    }

    return "";
  }

  async function handleContinueToPayment() {
    if (isCreatingPayment) return;

    setHasTriedContinue(true);

    const validationError = getBookingValidationError();

    if (validationError) {
      showToast("error", validationError);
      return;
    }

    setIsCreatingPayment(true);

    try {
      if (addressSnapshot) {
        void replaceSavedAddress(addressSnapshot);
      }

      const nextSession = await createBackendPaymentSession(bookingPayload);
      setPaymentSession(nextSession);
      setSelectedPaymentMode(selectedPlan === "weekly" ? "autopay" : null);
      setCheckoutStep("payment");
      showToast("success", bookingText.checkoutCreated);
    } catch (createError: unknown) {
      showToast(
        "error",
        getErrorMessage(
          createError,
          bookingText.bookingCreateError,
        ),
      );
    } finally {
      setIsCreatingPayment(false);
    }
  }

  function handleBackendPaymentDone() {
    if (!paymentSession || isProcessingPayment) return;

    setIsProcessingPayment(true);
    setCheckoutStep("success");
    showToast("success", bookingText.paymentSuccessful);
    setIsProcessingPayment(false);
  }

  function handleBackToDetails() {
    setCheckoutStep("details");
  }
  function handleStateChange(value: string) {
    setForm((current) => ({
      ...current,
      state: value,
      district: "",
      naal: "",
    }));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-4 bg-[#fbfbfd] text-[#061b4d]/65">
        <Loader2 className="h-6 w-6 animate-spin text-saffron" />
        <span className="text-sm font-bold">{bookingText.loadingBookingDetails}</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h1 className="text-2xl font-extrabold text-[#061b4d]">
          {bookingText.couldNotLoadBooking}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
          {error || bookingText.poojaNotFound}
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href={APP_ROUTES.poojaDetails(poojaId)}>{bookingText.backToPooja}</Link>
        </Button>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#061b4d]">
      <style jsx global>{`
        body > header,
        body > footer {
          display: none !important;
        }
      `}</style>

      <header className="border-b border-[#dde2ec] bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <Link
            href={APP_ROUTES.home}
            aria-label="Yaagam home"
            className="block"
          >
            <Image src="/logo_png.png" width={72} height={72} alt="Yaagam" />
          </Link>
          <LanguageSelector className="h-9 rounded-full border border-[#d8deea] px-2 text-[12px] font-extrabold text-[#061b4d]" />
        </div>
      </header>

      <section className="mx-auto max-w-[1160px] px-5 pt-10">
        <div className="grid grid-cols-5 items-start gap-5">
          {bookingText.steps.map((step, index) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center"
            >
              {index < bookingText.steps.length - 1 && (
                <span
                  className={`absolute left-1/2 top-3.5 h-px w-full ${index < activeStepIndex
                      ? "bg-[#ef7d1a]"
                      : "bg-[#e8ebf2]"
                    }`}
                />
              )}

              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold ${index <= activeStepIndex
                    ? "bg-[#ef7d1a] text-white"
                    : "bg-[#f0f2f7] text-[#9aa3b8]"
                  }`}
              >
                {index + 1}
              </span>

              <span
                className={`mt-2 text-[10px] font-extrabold ${index <= activeStepIndex
                    ? "text-[#ef7d1a]"
                    : "text-[#7a849d]"
                  }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1160px] gap-12 px-5 pb-12 pt-20 lg:grid-cols-[620px_320px] lg:justify-between">
        {checkoutStep === "details" ? (
          <form
            className="space-y-5"
            data-payload={JSON.stringify(bookingPayload)}
          >
            <div>
              <h1 className="text-[18px] font-extrabold leading-5 text-[#061b4d]">
                {bookingText.detailsTitle}
              </h1>
              <p className="mt-1 text-[12px] font-semibold text-[#7d86a0]">
                {bookingText.detailsSubtitle}
              </p>
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>{bookingText.name}</FieldLabel>
                <Input
                  className={inputClassName(isRequiredFieldInvalid(form.name))}
                  name="name"
                  required
                  placeholder={bookingText.namePlaceholder}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>

              {(!isWhatsappVerified || !form.whatsappNumber.trim()) && (
                <label className="block">
                  <FieldLabel required>{bookingText.whatsappNumber}</FieldLabel>
                  <Input
                    className={inputClassName(
                      isRequiredFieldInvalid(form.whatsappNumber),
                    )}
                    inputMode="tel"
                    name="whatsappNumber"
                    required
                    placeholder={bookingText.whatsappPlaceholder}
                    value={form.whatsappNumber}
                    onChange={(event) =>
                      handleWhatsAppNumberChange(event.target.value)
                    }
                  />
                </label>
              )}
            </div>

            <div className="space-y-3 rounded-md border border-[#d7f0dd] bg-[#f0fff4] px-4 py-3">
              <div className="flex items-center justify-between gap-5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#20b15a] text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-[#0d7d3c]">
                      {isWhatsappVerified
                        ? bookingText.whatsappVerified
                        : bookingText.verifyWhatsappNumber}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#51a46c]">
                      {isWhatsappVerified
                        ? bookingText.whatsappReady
                        : bookingText.whatsappOtpInfo}
                    </p>
                  </div>
                </div>
                {isWhatsappVerified ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChangeWhatsappNumber}
                    className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8]"
                  >
                    {bookingText.changeWhatsappNumber}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSendingOtp}
                    onClick={requestBookingOtp}
                    className="h-9 rounded-md border-[#ef7d1a] px-4 text-[12px] font-extrabold text-[#ef7d1a] hover:bg-[#fff4e8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingOtp
                      ? bookingText.sending
                      : otpSent
                        ? bookingText.resendOtp
                        : bookingText.sendOtp}
                  </Button>
                )}
              </div>

              {!isWhatsappVerified && otpSent && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    className={[
                      "h-10 rounded-md px-4 text-center text-[16px] font-extrabold tracking-[0.35em] shadow-none outline-none transition placeholder:text-[#667399]",
                      isRequiredFieldInvalid(otp)
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        : "border-[#d9e0ed] focus:border-saffron focus:ring-2 focus:ring-saffron/10",
                    ].join(" ")}
                    inputMode="numeric"
                    name="otp"
                    required
                    placeholder="------"
                    value={otp}
                    onChange={(event) => handleOtpChange(event.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={isVerifyingOtp}
                    onClick={verifyBookingOtp}
                    className="h-10 rounded-md bg-[#ef7d1a] px-5 text-[12px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isVerifyingOtp ? bookingText.verifying : bookingText.verifyAndLogin}
                  </Button>
                </div>
              )}

              {otpError && (
                <p className="text-[10px] font-bold text-red-600">{otpError}</p>
              )}
            </div>

            <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>{bookingText.state}</FieldLabel>
                <select
                  className={selectClassName(
                    form.state,
                    isRequiredFieldInvalid(form.state),
                  )}
                  name="state"
                  required
                  value={form.state}
                  onChange={(event) => handleStateChange(event.target.value)}
                >
                  <option value="">{bookingText.selectState}</option>
                  {indianStates.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel required>{bookingText.nakshatra}</FieldLabel>
                <select
                  className={selectClassName(
                    form.nakshatra,
                    isRequiredFieldInvalid(form.nakshatra),
                  )}
                  name="nakshatra"
                  required
                  value={form.nakshatra}
                  onChange={(event) =>
                    updateField("nakshatra", event.target.value)
                  }
                >
                  <option value="">{bookingText.selectNakshatra}</option>
                  {nakshatras.map((nakshatra) => (
                    <option key={nakshatra} value={nakshatra}>
                      {nakshatra}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel required>{naalFieldLabel}</FieldLabel>
                {isSouthState ? (
                  <select
                    className={selectClassName(
                      form.naal,
                      isRequiredFieldInvalid(form.naal),
                    )}
                    name="naal"
                    required
                    value={form.naal}
                    onChange={(event) =>
                      updateField("naal", event.target.value)
                    }
                  >
                    <option value="">{bookingText.selectNaal}</option>
                    {naalOptions.map((naal) => (
                      <option key={naal} value={naal}>
                        {naal}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className={inputClassName(isRequiredFieldInvalid(form.naal))}
                    name="naal"
                    required
                    placeholder={bookingText.enterGothra}
                    value={form.naal}
                    onChange={(event) =>
                      updateField("naal", event.target.value)
                    }
                  />
                )}
              </label>

              <label className="block">
                <FieldLabel>
                  {bookingText.specialRequest}{" "}
                  <span className="text-[#7d86a0]">{bookingText.optional}</span>
                </FieldLabel>
                <Input
                  className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                  name="specialRequest"
                  placeholder={bookingText.specialRequestPlaceholder}
                  value={form.specialRequest}
                  onChange={(event) =>
                    updateField("specialRequest", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="pt-3">
              <p className="text-[12px] font-extrabold text-[#ef7d1a]">
                {bookingText.prasadQuestion}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("wantsPrasad", true)}
                  className={`h-9 rounded-full px-4 text-[12px] font-extrabold ${form.wantsPrasad
                      ? "bg-[#ef7d1a] text-white"
                      : "border border-[#ef7d1a] bg-white text-[#ef7d1a]"
                    }`}
                >
                  {bookingText.yes}
                </button>
                <button
                  type="button"
                  onClick={() => updateField("wantsPrasad", false)}
                  className={`h-9 rounded-full px-4 text-[12px] font-extrabold ${form.wantsPrasad
                      ? "border border-[#ef7d1a] bg-white text-[#ef7d1a]"
                      : "bg-[#ef7d1a] text-white"
                    }`}
                >
                  {bookingText.no}
                </button>
              </div>
            </div>

            {form.wantsPrasad && (
              <div className="grid gap-x-7 gap-y-4 pt-3 md:grid-cols-2">
                <label className="block">
                  <FieldLabel>{bookingText.houseNo}</FieldLabel>
                  <Input
                    className="mt-1 h-10 rounded-md border-[#d9e0ed] px-4 text-[12px] shadow-none placeholder:text-[#667399]"
                    name="houseNo"
                    placeholder={bookingText.houseNoPlaceholder}
                    value={form.houseNo}
                    onChange={(event) =>
                      updateField("houseNo", event.target.value)
                    }
                  />
                </label>

                <div className="flex items-end justify-center md:justify-start">
                  <div className="mb-1 space-y-1 ">
                    <button
                      type="button"
                      disabled={isDetectingLocation}
                      onClick={handleUseCurrentLocation}
                      className="inline-flex items-center gap-2 text-[13px] font-extrabold text-[#ef7d1a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Navigation className="h-6 w-6" />
                      {isDetectingLocation
                        ? bookingText.gettingLocation
                        : bookingText.useCurrentLocation}
                    </button>
                    {locationError && (
                      <p className="max-w-52 text-[10px] font-bold leading-4 text-red-600">
                        {locationError}
                      </p>
                    )}
                  </div>
                </div>

                <label className="block">
                  <FieldLabel required>
                    {bookingText.roadName}
                  </FieldLabel>
                  <Input
                    className={inputClassName(
                      isRequiredFieldInvalid(form.streetName),
                    )}
                    name="streetName"
                    required
                    placeholder={bookingText.roadNamePlaceholder}
                    value={form.streetName}
                    onChange={(event) =>
                      updateField("streetName", event.target.value)
                    }
                  />
                </label>

                <label className="block">
                  <FieldLabel required>{bookingText.pincode}</FieldLabel>
                  <Input
                    className={inputClassName(
                      isRequiredFieldInvalid(form.pincode),
                    )}
                    inputMode="numeric"
                    name="pincode"
                    required
                    placeholder={bookingText.pincodePlaceholder}
                    value={form.pincode}
                    onChange={(event) =>
                      updateField("pincode", event.target.value)
                    }
                  />
                </label>

                <label className="block">
                  <FieldLabel required>{bookingText.district}</FieldLabel>
                  <select
                    className={selectClassName(
                      form.district,
                      isRequiredFieldInvalid(form.district),
                    )}
                    name="district"
                    required
                    value={form.district}
                    onChange={(event) =>
                      updateField("district", event.target.value)
                    }
                  >
                    <option value="">{bookingText.selectDistrict}</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <FieldLabel required>{bookingText.phoneNumber}</FieldLabel>
                  <Input
                    className={inputClassName(
                      isRequiredFieldInvalid(form.phoneNumber),
                    )}
                    inputMode="tel"
                    name="phoneNumber"
                    required
                    placeholder={bookingText.phoneNumberPlaceholder}
                    value={form.phoneNumber}
                    onChange={(event) =>
                      updateField("phoneNumber", event.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </form>
        ) : checkoutStep === "payment" ? (
          <BookingPaymentPage
            paymentSession={paymentSession}
            selectedPlan={selectedPlan}
            selectedPaymentMode={selectedPaymentMode}
            isProcessingPayment={isProcessingPayment}
            text={bookingText}
            onPaymentModeChange={setSelectedPaymentMode}
            onBack={handleBackToDetails}
            onComplete={handleBackendPaymentDone}
          />
        ) : null}

        <div className="space-y-5">
          <aside className="rounded-lg border border-[#edf0f6] bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-extrabold text-[#061b4d]">
              {bookingText.bookingSummary}
            </h2>
            <div className="mt-4 grid grid-cols-[72px_1fr] gap-4">
              <div className="relative h-[72px] overflow-hidden rounded-sm bg-[#f4f4f4]">
                <Image
                  src={summary.image}
                  alt={summary.title}
                  fill
                  unoptimized={summary.image.startsWith("http")}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="line-clamp-2 text-[12px] font-extrabold leading-4 text-[#061b4d]">
                  {summary.title}
                </h3>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-[#6b748c]">
                  {[summary.templeName, summary.templePlace]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-[12px] font-bold text-[#6f7890]">
              <p className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#8f98ad]" />
                  {bookingText.poojaDay}
                </span>
                <span className="text-right text-[#061b4d]">
                  {summary.nextDate}
                </span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4 text-[#8f98ad]" />
                  {bookingText.planType}
                </span>
                <span className="text-[#ef7d1a]">{summary.planName}</span>
              </p>
            </div>

            <div className="my-5 border-t border-[#edf0f6]" />
            <p className="flex items-center justify-between text-[12px] font-extrabold text-[#061b4d]">
              {bookingText.amount}
              <span className="text-lg text-[#ef7d1a]">
                {bookingText.currencyPrefix}{formatAmount(summary.amount)}
              </span>
            </p>

            <div className="mt-4 rounded-md bg-[#fff4e8] p-4">
              <p className="text-[12px] font-extrabold text-[#ef7d1a]">
                {bookingText.whatIsIncluded}
              </p>
              <div className="mt-3 space-y-2 text-[10px] font-bold text-[#4f5972]">
                {form.wantsPrasad && (
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                    {bookingText.prasadam}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#ef7d1a]" />
                  {bookingText.photosVideoWhatsapp}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-md bg-[#effff4] p-4 text-[10px] font-bold text-[#149149]">
              <p className="flex items-center gap-2 text-[12px] font-extrabold">
                <ShieldCheck className="h-6 w-4" />
                {bookingText.secureBooking}
              </p>
              <p className="mt-1 text-[#55a36d]">
                {bookingText.secureBookingText}
              </p>
            </div>
          </aside>

          <div>
            <p className="mb-7 flex items-center gap-2 text-[10px] font-semibold text-[#8a92a5]">
              <Lock className="h-3.5 w-3.5" />
              {bookingText.informationSecure}
            </p>
            <Button
              type="button"
              disabled={
                !isWhatsappVerified ||
                isCreatingPayment ||
                checkoutStep !== "details"
              }
              onClick={handleContinueToPayment}
              className="h-12 w-full rounded-lg bg-[#ef7d1a] text-[13px] font-extrabold text-white hover:bg-[#d96e13] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!isWhatsappVerified
                ? bookingText.verifyWhatsappToContinue
                : isCreatingPayment
                  ? bookingText.creatingBooking
                  : checkoutStep === "details"
                    ? bookingText.continueToPayment
                    : bookingText.paymentInProgress}
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[760px] grid-cols-2 gap-6 px-5 pb-12 pt-2 md:grid-cols-4">
        {bookingText.trustItems.map((item, index) => {
          const Icon = trustItemIcons[index] ?? Lock;
          return (
            <article key={item.title} className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#edf0f6] bg-white text-[#ef7d1a]">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-[12px] font-extrabold text-[#061b4d]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[10px] font-semibold text-[#8a92a5]">
                  {item.text}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <BookingSuccessModal
        open={checkoutStep === "success"}
        summary={summary}
        paymentSession={paymentSession}
        whatsappNumber={form.whatsappNumber}
        text={bookingText}
        onClose={() => setCheckoutStep("details")}
        formatAmount={formatAmount}
      />

      <footer className="border-t border-[#dfe4ee] bg-white">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-4 px-5 py-5 text-[10px] font-semibold text-[#7d86a0] md:flex-row">
          <p>© 2026 Yaagam Applications Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href={PLACEHOLDER_ROUTE}>{bookingText.termsOfUse}</Link>
            <Link href={PLACEHOLDER_ROUTE}>{bookingText.refundPolicy}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
