// src/lib/apiClient.ts
import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";


const BASE_URL = "http://localhost:8000/api/v1/";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

// --- crear instancia de axios ---
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json", 
  },
});

// --- agregar token en cada request ---
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// --- setear tokens y programar refresh ---
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (refreshTimeout) clearTimeout(refreshTimeout);

  // programar refresh 5 min después
  refreshTimeout = setTimeout(refreshAccessToken, 5 * 60 * 1000);
}

// --- limpiar tokens ---
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (refreshTimeout) clearTimeout(refreshTimeout);
}

// --- refresh token ---
async function refreshAccessToken() {
  if (!refreshToken) return;

  try {
    const response = await axios.post("http://localhost:8000/api/refresh/", {
      refresh: refreshToken,
    });
    const { access } = response.data as { access: string }; // 👈 tipamos para evitar error "unknown"
    if (access) {
      setTokens(access, refreshToken);
    }
  } catch (err) {
    console.error("Error refrescando token:", err);
    clearTokens();
  }
}

export default apiClient;
