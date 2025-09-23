// src/lib/apiClient.ts
import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "http://localhost:8000/api/v1/";
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// REMOVED: El interceptor de respuesta que manejaba los errores 401.

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);

  if (refreshTimeout) clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(refreshAccessToken, 5 * 60 * 1000);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  if (refreshTimeout) clearTimeout(refreshTimeout);
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return;
  try {
    const response = await axios.post("http://localhost:8000/api/refresh/", { refresh: refreshToken });
    const { access } = response.data as { access: string };
    if (access) {
      setTokens(access, refreshToken);
    }
  } catch (err) {
    console.error("Error refrescando token:", err);
    clearTokens();
  }
}

export default apiClient;