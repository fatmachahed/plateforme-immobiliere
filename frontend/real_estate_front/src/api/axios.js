import axios from "axios";
import API_URL from "../config";

const API = axios.create({
  baseURL: API_URL,
});

// Injecter le token sur chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les 401 globalement : token expiré ou invalide → déconnexion propre
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirige vers login sans casser le routeur React
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?session=expired";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
