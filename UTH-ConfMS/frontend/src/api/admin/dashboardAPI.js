// src/api/admin/dashboardAPI.js
import apiClient from "../../apiClient";

export const getDashboardStats = async () => {
    const response = await apiClient.get("/admin/dashboard/stats");
    return response.data;
};

export const getMonthlyUserStats = async () => {
    const response = await apiClient.get("/admin/dashboard/monthly");
    return response.data;
};

export const getWeeklyAccessStats = async () => {
    const response = await apiClient.get("/admin/dashboard/weekly");
    return response.data;
};
