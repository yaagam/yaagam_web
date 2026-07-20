import { apiClient } from "@/services/api-client";
import type { LoginResponse } from "@/types/auth";

export type LoginPayload = {
  username: string;
  password: string;
  totp: string;
  rememberDevice: boolean;
};

export async function loginOps(payload: LoginPayload) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function logoutOps() {
  await apiClient.post("/auth/logout");
}