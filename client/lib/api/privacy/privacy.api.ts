import axios from "axios";

import instance from "@/lib/api/axios/axios.instance";
import { getErrorMessage } from "@/lib/utils";

export const PRIVACY_NOTICE_VERSION = "2026-08-15";

export type PrivacyRequestType =
  | "ACCESS"
  | "CORRECTION"
  | "ERASURE"
  | "WITHDRAW_CONSENT"
  | "ACCOUNT_DELETION"
  | "NOMINATION"
  | "GRIEVANCE";

export type PrivacyRequestPayload = {
  requestType: PrivacyRequestType;
  details: string;
  preferredLanguage: string;
};

function unwrap(data: unknown): unknown {
  return data && typeof data === "object" && "data" in data
    ? (data as { data?: unknown }).data
    : data;
}

export async function createPrivacyRequest(payload: PrivacyRequestPayload) {
  try {
    const response = await instance.post("/privacy/requests", {
      ...payload,
      noticeVersion: PRIVACY_NOTICE_VERSION,
    });
    const data = unwrap(response.data);
    if (!data || typeof data !== "object") throw new Error("Invalid privacy service response.");
    const result = data as { reference?: unknown; status?: unknown };
    return { reference: String(result.reference ?? ""), status: String(result.status ?? "RECEIVED") };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(getErrorMessage(error.response?.data?.message, "Unable to submit the privacy request. Please email privacy@yaagam.in."));
    }
    throw error;
  }
}
