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
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type SupportTicketHistoryItem = {
  id: string;
  ticketNumber: string;
  name: string;
  phoneNumber: string;
  contactMethod: SupportContactMethod;
  problem: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
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

function normalizeTicketHistory(data: unknown): SupportTicketHistoryItem[] {
  const payload = getResponseData(data);

  if (!Array.isArray(payload)) return [];

  return payload
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((ticket) => ({
      id: String(ticket.id ?? ""),
      ticketNumber: String(ticket.ticketNumber ?? ""),
      name: String(ticket.name ?? ""),
      phoneNumber: String(ticket.phoneNumber ?? ""),
      contactMethod: ticket.contactMethod === "CALL" ? "CALL" : "WHATSAPP",
      problem: String(ticket.problem ?? ""),
      status:
        ticket.status === "IN_PROGRESS" || ticket.status === "RESOLVED"
          ? ticket.status
          : "OPEN",
      createdAt: String(ticket.createdAt ?? ""),
      updatedAt: String(ticket.updatedAt ?? ""),
      resolvedAt: ticket.resolvedAt == null ? null : String(ticket.resolvedAt),
    }));
}
export async function checkSupportTicketAvailabilityApi(phoneNumber: string) {
  try {
    const response = await instance.get("/support/tickets/check", {
      params: {
        phoneNumber: phoneNumber
          .replace(/\D/g, "")
          .replace(/^91(?=[6-9]\d{9}$)/, ""),
      },
    });
    const data = getResponseData(response.data);

    return normalizeAvailabilityResponse(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new SupportTicketApiError(
        getErrorMessage(
          error.response?.data?.message,
          "Unable to check your existing seva request. Please try again.",
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
    const response = await instance.post("/support/tickets", {
      ...payload,
      phoneNumber: payload.phoneNumber
        .replace(/\D/g, "")
        .replace(/^91(?=[6-9]\d{9}$)/, ""),
    });
    const data = getResponseData(response.data);

    return normalizeTicketResponse(data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new SupportTicketApiError(
        getErrorMessage(
          error.response?.data?.message,
          "Unable to submit your seva request. Please try again.",
        ),
        error.response?.status,
      );
    }

    throw new SupportTicketApiError(getErrorMessage(error));
  }
}

export async function getSupportTicketHistoryApi() {
  try {
    const response = await instance.get("/support/tickets/history");

    return normalizeTicketHistory(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new SupportTicketApiError(
        getErrorMessage(
          error.response?.data?.message,
          "Unable to load support history.",
        ),
        error.response?.status,
      );
    }

    throw new SupportTicketApiError(getErrorMessage(error));
  }
}
