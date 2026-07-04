import axios from "axios";

import instance from "@/lib/api/axios/axios.instance";
import { getErrorMessage } from "@/lib/utils";

export type SupportContactMethod = "WHATSAPP" | "CALL";

export type CreateSupportTicketPayload = {
  contactMethod: SupportContactMethod;
  name: string;
  phoneNumber: string;
  problem: string;
};

export type SupportTicketResponse = {
  ticketNumber: string;
};

export type SupportTicketAvailabilityResponse = {
  canCreate: boolean;
  message: string | null;
};

export class SupportTicketApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SupportTicketApiError";
    this.status = status;
  }
}

export function isSupportTicketApiError(
  error: unknown,
): error is SupportTicketApiError {
  return error instanceof SupportTicketApiError;
}

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

function normalizeTicketResponse(data: unknown): SupportTicketResponse {
  if (!data || typeof data !== "object") {
    return { ticketNumber: "" };
  }

  const ticket = data as {
    ticketNumber?: unknown;
    ticketNo?: unknown;
    ticketId?: unknown;
    id?: unknown;
  };
  const ticketNumber =
    ticket.ticketNumber ?? ticket.ticketNo ?? ticket.ticketId ?? ticket.id;

  return {
    ticketNumber: ticketNumber == null ? "" : String(ticketNumber),
  };
}

function normalizeAvailabilityResponse(
  data: unknown,
): SupportTicketAvailabilityResponse {
  if (!data || typeof data !== "object") {
    return { canCreate: true, message: null };
  }

  const availability = data as {
    canCreate?: unknown;
    message?: unknown;
  };

  return {
    canCreate:
      typeof availability.canCreate === "boolean"
        ? availability.canCreate
        : true,
    message:
      typeof availability.message === "string" ? availability.message : null,
  };
}

export async function checkSupportTicketAvailabilityApi(phoneNumber: string) {
  try {
    const response = await instance.get("/support/tickets/check", {
      params: { phoneNumber },
    });
    const data = getResponseData(response.data);

    return normalizeAvailabilityResponse(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new SupportTicketApiError(
        getErrorMessage(
          error.response?.data?.message,
          "Unable to check your existing support request. Please try again.",
        ),
        error.response?.status,
      );
    }

    throw new SupportTicketApiError(getErrorMessage(error));
  }
}

export async function createSupportTicketApi(
  payload: CreateSupportTicketPayload,
) {
  try {
    const response = await instance.post("/support/tickets", payload);
    const data = getResponseData(response.data);

    return normalizeTicketResponse(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new SupportTicketApiError(
        getErrorMessage(
          error.response?.data?.message,
          "Unable to submit your support request. Please try again.",
        ),
        error.response?.status,
      );
    }

    throw new SupportTicketApiError(getErrorMessage(error));
  }
}
