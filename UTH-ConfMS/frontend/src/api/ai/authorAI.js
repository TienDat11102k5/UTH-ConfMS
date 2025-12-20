/**
 * Author AI Features API Client
 * Handles communication with AI Service for spell check, grammar check, abstract polish, and keyword suggestions.
 */
import axios from "axios";
import { getToken } from "../../auth";

// AI Service base URL (different from main backend)
// AI Service base URL (Java Backend)
const AI_SERVICE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const aiApiClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/ai`,
  timeout: 30000,
});

// Add auth token to requests
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
 * Check spelling errors in text (Mapped to Grammar Check)
 * @param {string} text - Text to check
 * @param {string} language - Language code ('en' or 'vi')
// Parameters simplified as unused ones removed from signature
export const checkSpelling = async (text, language, conferenceId) => {
  try {
    const response = await aiApiClient.post("/grammar-check", {
      text: text,
      fieldName: "Content",
      conferenceId: conferenceId
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Spell check feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Spell check failed. Please try again."
    );
  }
};

export const checkGrammar = async (text, language, conferenceId) => {
  try {
    const response = await aiApiClient.post("/grammar-check", {
      text: text,
      fieldName: "Content",
      conferenceId: conferenceId
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Grammar check feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Grammar check failed. Please try again."
    );
  }
};

export const polishAbstract = async (
  abstract,
  language,
  conferenceId
) => {
  try {
    const response = await aiApiClient.post("/polish", {
      content: abstract,
      type: "Abstract",
      conferenceId: conferenceId
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Abstract polish feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Abstract polish failed. Please try again."
    );
  }
};

export const suggestKeywords = async (
  title,
  abstract,
  language,
  conferenceId,
  maxKeywords = 5
) => {
  try {
    const response = await aiApiClient.post("/suggest-keywords", {
      title,
      abstractText: abstract,
      maxKeywords: maxKeywords,
      conferenceId: conferenceId
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Keyword suggestion feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Keyword suggestion failed. Please try again."
    );
  }
};

/**
 * Apply polished abstract (user confirmation)
 * @param {string} paperId - Paper ID
 * @param {string} polishedAbstract - Polished abstract text
 * @param {string} userId - User ID
 * @param {string} conferenceId - Conference ID
 * @returns {Promise<Object>} Response with success status
 */
export const applyPolish = async (paperId, polishedAbstract, userId, conferenceId) => {
  try {
    const response = await aiApiClient.post("/apply-polish", {
      paperId: paperId,
      polishedAbstract: polishedAbstract,
      userConfirmed: true,
      // userId is not in DTO explicitly but controller takes it from token. 
      // However, controller ApplyPolishRequest DTO does NOT have userId. 
      // Controller code: Long userId = userDetails...;
      // So no need to send userId in body unless DTO has it.
      // My DTO ApplyPolishRequest: paperId, polishedAbstract, userConfirmed, conferenceId.
      conferenceId: conferenceId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || "Failed to apply polished abstract."
    );
  }
};

export default {
  checkSpelling,
  checkGrammar,
  polishAbstract,
  suggestKeywords,
  applyPolish,
};


