/**
 * Author AI Features API Client
 * Handles communication with AI Service for spell check, grammar check, abstract polish, and keyword suggestions.
 */
import axios from "axios";
import { getToken } from "../../auth";

// AI Service base URL (different from main backend)
const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

const aiApiClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/v1/authors`,
  timeout: 30000, // 30 seconds timeout for AI operations
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
 * Check spelling errors in text
 * @param {string} text - Text to check
 * @param {string} language - Language code ('en' or 'vi')
 * @param {string} conferenceId - Conference ID
 * @param {string} userId - Optional user ID
 * @returns {Promise<Object>} Response with errors array
 */
export const checkSpelling = async (text, language, conferenceId, userId = null) => {
  try {
    const response = await aiApiClient.post("/check-spelling", {
      text,
      language,
      conference_id: conferenceId,
      user_id: userId,
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

/**
 * Check grammar errors in text
 * @param {string} text - Text to check
 * @param {string} language - Language code ('en' or 'vi')
 * @param {string} conferenceId - Conference ID
 * @param {string} userId - Optional user ID
 * @returns {Promise<Object>} Response with errors array
 */
export const checkGrammar = async (text, language, conferenceId, userId = null) => {
  try {
    const response = await aiApiClient.post("/check-grammar", {
      text,
      language,
      conference_id: conferenceId,
      user_id: userId,
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

/**
 * Polish abstract to improve clarity and academic tone
 * @param {string} abstract - Abstract text
 * @param {string} language - Language code ('en' or 'vi')
 * @param {string} conferenceId - Conference ID
 * @param {string} paperId - Optional paper ID
 * @param {string} userId - Optional user ID
 * @param {boolean} preserveMeaning - Whether to preserve original meaning
 * @param {boolean} enhanceTone - Whether to enhance academic tone
 * @returns {Promise<Object>} Response with polished abstract and changes
 */
export const polishAbstract = async (
  abstract,
  language,
  conferenceId,
  paperId = null,
  userId = null,
  preserveMeaning = true,
  enhanceTone = true
) => {
  try {
    const response = await aiApiClient.post("/polish-abstract", {
      abstract,
      language,
      conference_id: conferenceId,
      paper_id: paperId,
      user_id: userId,
      preserve_meaning: preserveMeaning,
      enhance_tone: enhanceTone,
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

/**
 * Suggest keywords based on title and abstract
 * @param {string} title - Paper title
 * @param {string} abstract - Paper abstract
 * @param {string} language - Language code ('en' or 'vi')
 * @param {string} conferenceId - Conference ID
 * @param {number} maxKeywords - Maximum number of keywords (1-10)
 * @param {string} userId - Optional user ID
 * @returns {Promise<Object>} Response with keywords array
 */
export const suggestKeywords = async (
  title,
  abstract,
  language,
  conferenceId,
  maxKeywords = 5,
  userId = null
) => {
  try {
    const response = await aiApiClient.post("/suggest-keywords", {
      title,
      abstract,
      language,
      conference_id: conferenceId,
      max_keywords: maxKeywords,
      user_id: userId,
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
      paper_id: paperId,
      polished_abstract: polishedAbstract,
      user_confirmed: true,
      user_id: userId,
      conference_id: conferenceId,
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


