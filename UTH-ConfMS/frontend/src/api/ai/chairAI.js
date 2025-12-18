/**
 * Chair AI Features API Client
 * Handles communication with AI Service for reviewer assignment and email drafting.
 */
import axios from "axios";
import { getToken } from "../../auth";

const AI_SERVICE_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

const aiApiClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/v1`,
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
 * Calculate similarity between paper and reviewers
 */
export const calculateSimilarity = async (
  paperId,
  paperTitle,
  paperAbstract,
  paperKeywords,
  reviewerIds,
  reviewerData,
  conferenceId,
  userId = null
) => {
  try {
    const response = await aiApiClient.post("/assignment/calculate-similarity", {
      paper_id: paperId,
      paper_title: paperTitle,
      paper_abstract: paperAbstract,
      paper_keywords: paperKeywords,
      reviewer_ids: reviewerIds,
      reviewer_data: reviewerData,
      conference_id: conferenceId,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Reviewer similarity feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Similarity calculation failed. Please try again."
    );
  }
};

/**
 * Suggest reviewer-paper assignments
 */
export const suggestAssignments = async (
  conferenceId,
  paperIds,
  paperData,
  reviewerIds,
  reviewerData,
  constraints,
  existingAssignments = [],
  userId = null
) => {
  try {
    const response = await aiApiClient.post("/assignment/suggest-assignments", {
      conference_id: conferenceId,
      paper_ids: paperIds,
      paper_data: paperData,
      reviewer_ids: reviewerIds,
      reviewer_data: reviewerData,
      constraints,
      existing_assignments: existingAssignments,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Assignment suggestion feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Assignment suggestion failed. Please try again."
    );
  }
};

/**
 * Draft email (accept/reject/reminder)
 */
export const draftEmail = async (
  emailType,
  conferenceId,
  options = {},
  userId = null
) => {
  try {
    const response = await aiApiClient.post("/chairs/draft-email", {
      email_type: emailType,
      conference_id: conferenceId,
      ...options,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("Email draft feature is not enabled for this conference");
    }
    throw new Error(
      error.response?.data?.detail || "Email draft generation failed. Please try again."
    );
  }
};

/**
 * Approve email draft
 */
export const approveEmailDraft = async (
  draftId,
  editedSubject = null,
  editedBody = null,
  userId
) => {
  try {
    const response = await aiApiClient.put("/chairs/approve-email-draft", {
      draft_id: draftId,
      edited_subject: editedSubject,
      edited_body: editedBody,
      approved: true,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || "Failed to approve email draft."
    );
  }
};

export default {
  calculateSimilarity,
  suggestAssignments,
  draftEmail,
  approveEmailDraft,
};


