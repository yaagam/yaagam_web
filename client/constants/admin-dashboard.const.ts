import {
  CalendarClock,
  ClipboardList,
  IndianRupee,
  PackageCheck,
} from "lucide-react";

export const ADMIN_DASHBOARD_STATS = [
  {
    label: "Bookings today",
    value: "24",
    change: "+8 from yesterday",
    icon: ClipboardList,
  },
  {
    label: "Poojas scheduled",
    value: "12",
    change: "Across 4 temples",
    icon: CalendarClock,
  },
  {
    label: "Prasad dispatch",
    value: "18",
    change: "6 pending packing",
    icon: PackageCheck,
  },
  {
    label: "Revenue",
    value: "Rs 48k",
    change: "Current day estimate",
    icon: IndianRupee,
  },
];

export const ADMIN_DASHBOARD_BOOKINGS = [
  {
    devotee: "Ananya Nair",
    pooja: "Chandra Graha Pooja",
    temple: "Kottayil Kovilakam",
    status: "Confirmed",
  },
  {
    devotee: "Rahul Sharma",
    pooja: "Guru Graha Pooja",
    temple: "Kottayil Kovilakam",
    status: "Awaiting sankalpam",
  },
  {
    devotee: "Meera Iyer",
    pooja: "Nava Graha Pooja",
    temple: "Kottayil Kovilakam",
    status: "Prasad pending",
  },
];

export const ADMIN_DASHBOARD_SCHEDULE = [
  "Review new WhatsApp OTP sign-ins",
  "Assign priests for tomorrow's graha poojas",
  "Confirm prasad address queue",
  "Publish ceremony update messages",
];