/**
 * AI Governance API Client
 * Kết nối tới ai-service để quản lý feature flags, audit logs và usage stats.
 */
import axios from "axios";
import { getToken } from "../../auth";

const AI_SERVICE_BASE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

const aiGovernanceClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/v1/governance`,
  timeout: 30000,
});

aiGovernanceClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Lấy danh sách feature flags cho một hội nghị.
 * Trả về dạng { conference_id, features: { spell_check: true, ... } }
 */
export const getFeatureFlags = async (conferenceId) => {
  try {
    const res = await aiGovernanceClient.get(`/features/${conferenceId}`);
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      "Không thể tải cấu hình tính năng AI. Vui lòng thử lại."
    );
  }
};

/**
 * Bật một feature cho hội nghị.
 */
export const enableFeature = async (conferenceId, featureName, userId) => {
  try {
    const res = await aiGovernanceClient.post("/features/enable", {
      conference_id: conferenceId,
      feature_name: featureName,
      user_id: userId,
    });
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      "Không thể bật tính năng AI. Vui lòng thử lại."
    );
  }
};

/**
 * Tắt một feature cho hội nghị.
 */
export const disableFeature = async (conferenceId, featureName, userId) => {
  try {
    const res = await aiGovernanceClient.post("/features/disable", {
      conference_id: conferenceId,
      feature_name: featureName,
      user_id: userId,
    });
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      "Không thể tắt tính năng AI. Vui lòng thử lại."
    );
  }
};

/**
 * Lấy audit logs (nhật ký AI) theo hội nghị và/hoặc feature.
 */
export const getAuditLogs = async ({
  conferenceId,
  feature,
  userId,
  limit = 50,
  offset = 0,
}) => {
  try {
    const params = {
      limit,
      offset,
    };
    if (conferenceId) params.conference_id = conferenceId;
    if (feature) params.feature = feature;
    if (userId) params.user_id = userId;

    const res = await aiGovernanceClient.get("/audit-logs", { params });
    return res.data; // { logs, total, limit, offset }
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      "Không thể tải nhật ký AI. Vui lòng thử lại."
    );
  }
};

export default {
  getFeatureFlags,
  enableFeature,
  disableFeature,
  getAuditLogs,
};


