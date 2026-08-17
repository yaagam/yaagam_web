import instance from "../axios/axios.instance";
import { createOtpApiError } from "./otp-error";

export interface SendOtpResponse {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export async function sendOtpApi(
  whatsappNumber: string,
): Promise<SendOtpResponse> {
  try {
    const response = await instance.post("/auth/send-otp", { whatsappNumber });
    const data = response.data?.data ?? response.data ?? {};

    return {
      expiresInSeconds: Number(data.expiresInSeconds) || 300,
      resendAfterSeconds: Number(data.resendAfterSeconds) || 60,
    };
  } catch (error: unknown) {
    throw createOtpApiError(error, "Unable to send OTP. Please try again.");
  }
}
