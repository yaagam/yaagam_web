import instance from "@/lib/api/axios/axios.instance";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type BookingType = "WEEKLY" | "SINGLE";
export type MyPoojaDisplayStatus =
  | "Payment Pending"
  | "Payment Failed"
  | "Booked"
  | "Scheduled"
  | "Completed"
  | "Cancelled"
  | "Refunded";

export type MyPoojaItem = {
  reference: string;
  bookingNumber: string;
  pooja: {
    reference: string;
    name: string;
    imageUrls: string[];
    instructionTranslations: Array<{
      language: "EN" | "ML" | "HI" | "MR" | "TA";
      mantra: string;
      dos: string[];
      donts: string[];
    }>;
  };
  temple: {
    reference: string;
    name: string;
  };
  poojaDay: string | null;
  bookingDate: string;
  poojaDate: string;
  type: BookingType;
  displayType: "Weekly Plan" | "Single Day";
  status: BookingStatus;
  displayStatus: MyPoojaDisplayStatus;
  amount: {
    base: number;
    discount: number;
    final: number;
    pooja: number;
    currency: "INR";
  };
  offerings: Array<{
    name: string;
    quantity: number;
    unitAmount: number;
    total: number;
  }>;
  dakshinaAmount: number;
  devotees: Array<{ name: string; naal: string }>;
  address: {
    houseNo: string;
    streetName: string;
    pincode: string;
    district: string;
    state: string;
    phoneNumber: string;
  } | null;
  whatsappNumber: string;
  latestPaymentStatus: string | null;
  completionNote: string | null;
  createdAt: string;
};

export type MyPoojasMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type MyPoojasResponse = {
  items: MyPoojaItem[];
  meta: MyPoojasMeta;
};

export type GetMyPoojasParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookingStatus;
};

const emptyMeta: MyPoojasMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function getResponseData(responseData: unknown) {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as { data?: unknown }).data;
  }

  return responseData;
}

function isMyPoojaItem(value: unknown): value is MyPoojaItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<MyPoojaItem>;

  return Boolean(
    item.reference && item.bookingNumber && item.pooja && item.temple,
  );
}

function normalizeMyPoojasResponse(data: unknown): MyPoojasResponse {
  const payload = getResponseData(data);

  if (!payload || typeof payload !== "object") {
    return { items: [], meta: emptyMeta };
  }

  const response = payload as Partial<MyPoojasResponse>;

  return {
    items: Array.isArray(response.items)
      ? response.items.filter(isMyPoojaItem)
      : [],
    meta: {
      ...emptyMeta,
      ...(response.meta ?? {}),
    },
  };
}

export async function getMyPoojasApi(params: GetMyPoojasParams = {}) {
  const response = await instance.get("/bookings/my-poojas", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      status: params.status,
    },
  });

  return normalizeMyPoojasResponse(response.data);
}

export async function getMyPoojaTrackingApi(bookingNumber: string) {
  const response = await getMyPoojasApi({ search: bookingNumber, limit: 10 });
  return (
    response.items.find((item) => item.bookingNumber === bookingNumber) ?? null
  );
}

export async function downloadBookingInvoiceApi(bookingNumber: string) {
  const response = await instance.get(
    `/bookings/${encodeURIComponent(bookingNumber)}/invoice`,
    { responseType: "blob" },
  );
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    `Yaagam-Invoice-${bookingNumber}.pdf`;
  return { content: response.data as Blob, filename };
}
