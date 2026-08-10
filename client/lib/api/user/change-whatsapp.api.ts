import apiClient from "@/lib/api/axios/axios.instance";
import { getErrorMessage } from "@/lib/utils";
import { normalizeWhatsappNumber } from "@/lib/phone";

function payloadOf(value: unknown) {
  return value && typeof value === "object" && "data" in value
    ? (value as { data?: unknown }).data
    : value;
}

export async function sendChangeWhatsappOtpApi(whatsappNumber: string) {
  const response = await apiClient.post("/users/whatsapp-number/change-otp", {
    whatsappNumber,
  });
  const payload = payloadOf(response.data);
  const sessionId =
    payload && typeof payload === "object" && "sessionId" in payload
      ? (payload as { sessionId?: unknown }).sessionId
      : null;

  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error("Unable to start WhatsApp number verification.");
  }
  return sessionId;
}

export async function verifyChangeWhatsappOtpApi(
  sessionId: string,
  otp: string,
) {
  const response = await apiClient.post(
    "/users/whatsapp-number/change-verify",
    { sessionId, otp },
  );
  const payload = payloadOf(response.data);
  const whatsappNumber =
    payload && typeof payload === "object" && "whatsappNumber" in payload
      ? (payload as { whatsappNumber?: unknown }).whatsappNumber
      : null;

  if (typeof whatsappNumber !== "string" || !whatsappNumber) {
    throw new Error(
      getErrorMessage(payload, "Unable to verify the new WhatsApp number."),
    );
  }
  return normalizeWhatsappNumber(whatsappNumber);
}
