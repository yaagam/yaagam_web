import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession, persistSession } from "@/lib/auth-storage";
import type { ApiResponse } from "@/types/api";
import type { OpsAuthResponse } from "@/types/auth";

// Browser calls remain same-origin; the upstream URL only exists server-side.
const baseURL = "/api/ops";

const authRecoverySkippedPaths = ["/auth/login", "/auth/logout", "/auth/refresh"];

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function shouldSkipAuthRecovery(url?: string) {
  return authRecoverySkippedPaths.some((path) => url?.endsWith(path));
}

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      response.data = (response.data as ApiResponse<unknown>).data;
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || shouldSkipAuthRecovery(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await axios.post<ApiResponse<OpsAuthResponse>>(`${baseURL}/auth/refresh`, undefined, {
        withCredentials: true
      });
      persistSession(data.data);
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      if (typeof window !== "undefined") window.location.replace("/");
      return Promise.reject(refreshError);
    }
  }
);
