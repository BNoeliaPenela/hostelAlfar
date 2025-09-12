
import axios from "axios";
import apiClient, { setTokens, clearTokens } from "../../../lib/apiClient";

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

  isAuthenticated: () => {
    return Boolean(localStorage.getItem("access")); 
  },
};
