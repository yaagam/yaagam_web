import type { Language } from "@/lib/i18n/translations";

export const accountLabels: Record<
  Language,
  { myAccount: string; myPoojas: string; changeNumber: string; logout: string }
> = {
  en: {
    myAccount: "My Account",
    myPoojas: "My Poojas",
    changeNumber: "Change WhatsApp Number",
    logout: "logout",
  },
  ml: {
    myAccount: "എന്റെ അക്കൗണ്ട്",
    myPoojas: "എന്റെ പൂജകൾ",
    changeNumber: "വാട്സ്ആപ്പ് നമ്പർ മാറ്റുക",
    logout: "ലോഗ് ഔട്ട്",
  },
  hi: {
    myAccount: "मेरा अकाउंट",
    myPoojas: "मेरी पूजाएं",
    changeNumber: "WhatsApp नंबर बदलें",
    logout: "लॉग आउट",
  },
  mr: {
    myAccount: "माझे खाते",
    myPoojas: "माझ्या पूजा",
    changeNumber: "WhatsApp नंबर बदला",
    logout: "लॉग आउट",
  },
  ta: {
    myAccount: "என் கணக்கு",
    myPoojas: "என் பூஜைகள்",
    changeNumber: "WhatsApp எண்ணை மாற்றவும்",
    logout: "வெளியேறு",
  },
};
