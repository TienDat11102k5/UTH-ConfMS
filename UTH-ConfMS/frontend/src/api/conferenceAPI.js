// src/api/conferenceAPI.js
import apiClient from '../apiClient';

/**
 * Get all conferences (public)
 */
export const getConferencesAPI = async () => {
  const response = await apiClient.get('/conferences');
  return response.data;
};

/**
 * Get conference by ID (public)
 */
export const getConferenceByIdAPI = async (id) => {
  const response = await apiClient.get(`/conferences/${id}`);
  return response.data;
};

/**
 * Get conference tracks
 */
export const getConferenceTracksAPI = async (conferenceId) => {
  const response = await apiClient.get(`/conferences/${conferenceId}/tracks`);
  return response.data;
};
