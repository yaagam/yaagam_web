import { apiClient } from "@/services/api-client";
import type { PaginatedResponse } from "@/types/api";
import type { Booking, BookingStatus, Pooja, Temple } from "@/types/ops";

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export async function getDashboardSummary() {
  const { data } = await apiClient.get("/dashboard");
  return data as {
    todayBookings: number;
    weeklyRevenue: number;
    pendingBookings: number;
    upcomingPoojas: number;
    recentActivity: { id: string; label: string; createdAt: string }[];
    latestBookings: Booking[];
  };
}

export async function getBookings(params: ListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Booking>>("/bookings", {
    params
  });
  return data;
}

export async function getBooking(id: string) {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
  return data;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/status`, {
    status
  });
  return data;
}

export async function getTemples(params: ListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Temple>>("/temples", {
    params
  });
  return data;
}

export async function upsertTemple(payload: FormData) {
  const id = payload.get("id");
  const { data } = id
    ? await apiClient.put<Temple>(`/temples/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    : await apiClient.post<Temple>("/temples", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  return data;
}

export async function getPoojas(params: ListParams) {
  const { data } = await apiClient.get<PaginatedResponse<Pooja>>("/poojas", {
    params
  });
  return data;
}

export async function upsertPooja(payload: unknown, id?: string) {
  const { data } = id
    ? await apiClient.put<Pooja>(`/poojas/${id}`, payload)
    : await apiClient.post<Pooja>("/poojas", payload);
  return data;
}