import axios from "axios";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
  clearClientLoginState,
  markClientLoggedIn,
  markClientRefreshSucceeded,
  wasClientRefreshRecentlySucceeded,
} from "@/lib/auth/client-session";
import { getUserRoleFromUnknown } from "@/lib/auth/roles";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type ApiErrorResponse = {
  message?: unknown;
};

const REFRESH_ENDPOINT = "/auth/refresh";
const AUTH_ENDPOINTS_WITHOUT_RETRY = [
  REFRESH_ENDPOINT,
  "/auth/logout",
  "/auth/logout-all-devices",
  "/auth/send-otp",
  "/auth/verify-otp",
];

let refreshRequest: Promise<AxiosResponse<unknown>> | null = null;
const REFRESH_RACE_GRACE_MS = 5000;

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 60000,
})

function getRequestPath(url?: string) {
  if (!url) return "";

  try {
    return new URL(url, process.env.NEXT_PUBLIC_API_URL).pathname;
  } catch {
    return url;
  }
}

function isAuthEndpointWithoutRetry(url?: string) {
  const path = getRequestPath(url);

  return AUTH_ENDPOINTS_WITHOUT_RETRY.some((endpoint) =>
    path.endsWith(endpoint),
  );
}

function getApiErrorMessage(error: AxiosError<ApiErrorResponse>) {
  const message = error.response?.data?.message;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");

  return "";
}

function getResponsePayload(data: unknown) {
  return data && typeof data === "object" && "data" in data
    ? (data as { data?: unknown }).data
    : data;
}

function shouldIgnoreRefreshFailure() {
  return wasClientRefreshRecentlySucceeded(REFRESH_RACE_GRACE_MS);
}

function shouldRefreshAccessToken(error: AxiosError<ApiErrorResponse>) {
  const request = error.config as RetriableRequestConfig | undefined;

  if (!request || request._retry) return false;
  if (error.response?.status !== 401) return false;
  if (isAuthEndpointWithoutRetry(request.url)) return false;

  return true;
}

export async function refreshAuthSession() {
  const request = refreshRequest ?? instance.post(REFRESH_ENDPOINT);
  refreshRequest = request;

  try {
    const refreshResponse = await request;
    const role = getUserRoleFromUnknown(getResponsePayload(refreshResponse.data));

    if (!role) {
      clearClientLoginState();
      throw new Error("Unable to verify refreshed session.");
    }

    markClientLoggedIn(role);
    markClientRefreshSucceeded();

    return role;
  } catch (refreshError) {
    if (!shouldIgnoreRefreshFailure()) {
      clearClientLoginState();
    }

    throw refreshError;
  } finally {
    if (refreshRequest === request) {
      refreshRequest = null;
    }
  }
}

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    if (!shouldRefreshAccessToken(error)) {
      if (
        error.response?.status === 401 &&
        getApiErrorMessage(error) === "Invalid refresh token" &&
        !shouldIgnoreRefreshFailure()
      ) {
        clearClientLoginState();
      }

      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig;
    originalRequest._retry = true;

    try {
      await refreshAuthSession();

      return instance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
