import { apiClient } from "@/services/api-client";
import type { OpsAuthResponse } from "@/types/auth";

export type LoginPayload = {
  username: string;
  password: string;
  totp: string;
  rememberDevice: boolean;
};

export async function loginOps(payload: LoginPayload) {
  const { data } = await apiClient.post<OpsAuthResponse>("/auth/login", {
    username: payload.username,
    password: payload.password,
    totpCode: payload.totp
  });
  return data;
}

export async function logoutOps() {
  await apiClient.post("/auth/logout");
}