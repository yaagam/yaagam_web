import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession, getAccessToken, getRefreshToken, persistSession } from "@/lib/auth-storage";
import type { LoginResponse } from "@/types/auth";

const baseURL =
  process.env.NEXT_PUBLIC_OPS_API_BASE_URL ?? "https://api.yaagam.in/api/v1/ops";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await axios.post<LoginResponse>(`${baseURL}/auth/refresh`, {
        refreshToken
      });
      persistSession(data);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  }
);