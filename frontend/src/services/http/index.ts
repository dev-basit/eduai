import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from '@/config';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 600_000, // AI calls can be slow on local Ollama
});

// ── Request interceptor ───────────────────────────────────────
// Attach auth token from localStorage (if present) on every request.
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────
// Normalise errors into a single ApiError shape so callers don't
// need to inspect AxiosError internals.
export interface ApiError {
  status: number;
  message: string;
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message = (data?.detail as string) ?? error.message ?? 'An unexpected error occurred';
  return { status, message };
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const apiError = toApiError(error);

    // Clear stored token on 401 so the UI can redirect to login
    if (apiError.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }

    return Promise.reject(apiError);
  },
);
