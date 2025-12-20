// src/api/submissionAPI.js
import apiClient from '../apiClient';

/**
 * Submit a new paper
 */
export const submitPaperAPI = async (formData) => {
  const response = await apiClient.post('/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Get my submissions
 */
export const getMySubmissionsAPI = async (conferenceId = null) => {
  const params = conferenceId ? { conferenceId } : {};
  const response = await apiClient.get('/submissions', { params });
  return response.data;
};

/**
 * Get submission by ID
 */
export const getSubmissionByIdAPI = async (id) => {
  const response = await apiClient.get(`/submissions/${id}`);
  return response.data;
};

/**
 * Update submission
 */
export const updateSubmissionAPI = async (id, formData) => {
  const response = await apiClient.put(`/submissions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Withdraw submission
 */
export const withdrawSubmissionAPI = async (id) => {
  const response = await apiClient.post(`/submissions/${id}/withdraw`);
  return response.data;
};
