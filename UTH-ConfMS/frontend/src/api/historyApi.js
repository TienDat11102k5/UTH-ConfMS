import apiClient from '../apiClient';

export const getMyActivities = async () => {
    const response = await apiClient.get('/history/my-activities');
    return response.data;
};

export const getRecentActivities = async (timeRange) => {
    const response = await apiClient.get('/history/my-activities/recent', {
        params: { range: timeRange }
    });
    return response.data;
};

export const getActivitiesByGroup = async (group) => {
    const response = await apiClient.get('/history/my-activities/by-group', {
        params: { group }
    });
    return response.data;
};

export const getActivityStats = async () => {
    const response = await apiClient.get('/history/my-activities/stats');
    return response.data;
};
