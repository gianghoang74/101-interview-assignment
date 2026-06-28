import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearToken, getToken } from './token';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export const api = axios.create({ baseURL });

// Attach the JWT (from localStorage) as a Bearer token on every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an API error response. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return error.message;
  }
  return 'Unexpected error';
}
