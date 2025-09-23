// src/services/authService.ts
import axios from "axios";
import { setTokens, clearTokens } from "../../../lib/apiClient"; // Asegúrate de que la ruta sea correcta

const BASE_URL = "http://localhost:8000"; 

interface UserCredentials {
  username: string;
  password: string;
}

export const authService = {
  login: async ({ username, password }: UserCredentials): Promise<boolean> => {
    try {
      const response = await axios.post(`${BASE_URL}/api/login/`, {
        username,
        password,
      });

      const { access, refresh } = response.data;
      if (access && refresh) {
        setTokens(access, refresh);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error en login:", err);
      return false;
    }
  },

  logout: () => {
    clearTokens();
  },

  isAuthenticated: (): boolean => {
    // Lee el accessToken desde el localStorage, usando la clave correcta.
    // Una verificación más robusta sería verificar también el token de refresco.
    const accessToken = localStorage.getItem("accessToken");
    return Boolean(accessToken);
  },
};