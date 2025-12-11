// src/apiClient.js
import axios from "axios";
import { getToken } from "./auth";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  withCredentials: true, // nếu backend không dùng cookie thì có thể set false
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken(); // lấy từ auth.js
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
