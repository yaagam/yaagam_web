import instance from "../axios/axios.instance";
import { createOtpApiError } from "./otp-error";
import { getUserRoleFromUnknown, type UserRole } from "@/lib/auth/roles";

export type VerifyOtpResponse = {
  role: UserRole | null;
  userId: string;
  whatsappNumber: string;
  raw: unknown;
};

function getUserIdFromUnknown(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const authData = data as {
    userId?: unknown;
    id?: unknown;
    user?: { id?: unknown };
    account?: { id?: unknown };
    loggedInUser?: { id?: unknown };
  };
  const userId =
    authData.userId ??
    authData.id ??
    authData.user?.id ??
    authData.account?.id ??
    authData.loggedInUser?.id;

  return typeof userId === "string" ? userId : "";
}

function getWhatsappNumberFromUnknown(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const authData = data as {
    whatsappNumber?: unknown;
    phone?: unknown;
    mobile?: unknown;
    user?: { whatsappNumber?: unknown; phone?: unknown; mobile?: unknown };
    account?: { whatsappNumber?: unknown; phone?: unknown; mobile?: unknown };
    loggedInUser?: {
      whatsappNumber?: unknown;
      phone?: unknown;
      mobile?: unknown;
    };
  };
  const whatsappNumber =
    authData.whatsappNumber ??
    authData.phone ??
    authData.mobile ??
    authData.user?.whatsappNumber ??
    authData.user?.phone ??
    authData.user?.mobile ??
    authData.account?.whatsappNumber ??
    authData.account?.phone ??
    authData.account?.mobile ??
    authData.loggedInUser?.whatsappNumber ??
    authData.loggedInUser?.phone ??
    authData.loggedInUser?.mobile;

  return typeof whatsappNumber === "string" ? whatsappNumber : "";
}

export async function verifyOtpApi(otp: string): Promise<VerifyOtpResponse> {
  try {
    const res = await instance.post("/auth/verify-otp", { otp });
    const data = res.data?.data ?? res.data;

    return {
      role: getUserRoleFromUnknown(data),
      userId: getUserIdFromUnknown(data),
      whatsappNumber: getWhatsappNumberFromUnknown(data),
      raw: data,
    };
  } catch (error: unknown) {
    throw createOtpApiError(
      error,
      "OTP verification failed. Please try again.",
    );
  }
}
