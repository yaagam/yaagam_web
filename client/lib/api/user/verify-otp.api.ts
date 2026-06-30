import axios from "axios";
import instance from "../axios/axios.instance";
import { getErrorMessage } from "@/lib/utils";
import { getUserRoleFromUnknown, type UserRole } from "@/lib/auth/roles";

export type VerifyOtpResponse = {
  role: UserRole | null;
  userId: string;
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

export async function verifyOtpApi(otp: string): Promise<VerifyOtpResponse> {
  try {
    const res = await instance.post("/auth/verify-otp", { otp });
    const data = res.data?.data ?? res.data;

    return {
      role: getUserRoleFromUnknown(data),
      userId: getUserIdFromUnknown(data),
      raw: data,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getErrorMessage(
          error.response?.data?.message,
          "OTP verification failed. Please try again.",
        ),
      );
    }

    throw new Error(getErrorMessage(error));
  }
}
