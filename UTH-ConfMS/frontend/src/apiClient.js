// src/apiClient.js
import axios from "axios";
import { getToken, clearAuth } from "./auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  withCredentials: true, // nếu backend không dùng cookie có thể chuyển false
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: tự clear auth khi 401 (tuỳ bạn dùng)
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(err);
  }
);

export default apiClient;
