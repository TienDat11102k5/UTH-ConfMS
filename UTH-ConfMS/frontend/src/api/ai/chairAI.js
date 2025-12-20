/**
 * Chair AI Features API Client
 * Handles communication with AI Service for reviewer assignment and email drafting.
 */
import axios from "axios";
import { getToken } from "../../auth";

const AI_SERVICE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const aiApiClient = axios.create({
  baseURL: `${AI_SERVICE_BASE_URL}/api/ai`,
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
  conferenceId
) => {
  try {
    const response = await aiApiClient.post("/reviewer-similarity", {
      paperTitle: paperTitle,
      paperKeywords: paperKeywords,
      reviewers: reviewerData,
      conferenceId: conferenceId
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

export const suggestAssignments = async (
  conferenceId,
  paperIds,
  paperData,
  reviewerIds,
  reviewerData,
  constraints
) => {
  try {
    const response = await aiApiClient.post("/assignments-suggestion", {
      conferenceId: conferenceId,
      papersMetadata: JSON.stringify(paperData),
      reviewersMetadata: JSON.stringify(reviewerData),
      constraints: JSON.stringify(constraints),
      paperIds: paperIds.map(String),
      reviewerIds: reviewerIds.map(String)
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

export const draftEmail = async (
  emailType,
  conferenceId,
  options = {}
) => {
  try {
    const response = await aiApiClient.post("/draft-email", {
      emailType: emailType,
      conferenceId: conferenceId,
      recipientName: options.recipientName,
      paperTitle: options.paperTitle || options.paper_title,
      conferenceName: options.conferenceName || options.conference_name,
      decision: options.decision,
      comments: options.comments,
      language: options.language || "vi"
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


