/**
 * Reviewer AI Features API Client
 * Handles communication with AI Service for synopsis generation and key point extraction.
 */
import axios from "axios";
import { getToken } from "../../auth";

const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

const aiApiClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/v1/reviewers`,
  timeout: 30000,
});

aiApiClient.interceptors.request.use(
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
 * Generate synopsis for a paper
 */
export const generateSynopsis = async (
  paperId,
  title,
  abstract,
  conferenceId,
  keywords = [],
  length = "medium",
  language = "en",
  reviewerId = null
) => {
  try {
    const response = await aiApiClient.post("/generate-synopsis", {
      paper_id: paperId,
      title,
      abstract,
      keywords,
      conference_id: conferenceId,
      length,
      language,
      reviewer_id: reviewerId,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Synopsis generation feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Synopsis generation failed. Please try again."
    );
  }
};

/**
 * Extract key points from a paper
 */
export const extractKeyPoints = async (
  paperId,
  title,
  abstract,
  conferenceId,
  language = "en",
  reviewerId = null
) => {
  try {
    const response = await aiApiClient.post("/extract-keypoints", {
      paper_id: paperId,
      title,
      abstract,
      conference_id: conferenceId,
      language,
      reviewer_id: reviewerId,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Key point extraction feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Key point extraction failed. Please try again."
    );
  }
};

/**
 * Report inaccuracy in synopsis
 */
export const reportInaccuracy = async (synopsisId, issue, reviewerId) => {
  // This should call backend API to log feedback
  // Placeholder for now
  console.log("Reporting inaccuracy:", { synopsisId, issue, reviewerId });
  return { success: true, message: "Feedback recorded" };
};

export default {
  generateSynopsis,
  extractKeyPoints,
  reportInaccuracy,
};


