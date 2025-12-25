// API client for user activity history
import apiClient from '../apiClient';

/**
 * Lấy tất cả lịch sử hoạt động của user hiện tại
 */
export const getMyActivities = async (page = null, size = null) => {
    const params = {};
    if (page !== null) params.page = page;
    if (size !== null) params.size = size;

    const response = await apiClient.get('/history/my-activities', { params });
    return response.data;
};

/**
 * Lọc theo loại hoạt động cụ thể
 */
export const getActivitiesByType = async (activityType) => {
    const response = await apiClient.get('/history/my-activities/by-type', {
        params: { type: activityType }
    });
    return response.data;
};

/**
 * Lọc theo nhóm hoạt động (paper, review, auth/system)
 */
export const getActivitiesByGroup = async (group) => {
    const response = await apiClient.get('/history/my-activities/by-group', {
        params: { group }
    });
    return response.data;
};

/**
 * Lọc theo khoảng thời gian
 */
export const getActivitiesByDateRange = async (from, to, page = null, size = null) => {
    const params = { from, to };
    if (page !== null) params.page = page;
    if (size !== null) params.size = size;

    const response = await apiClient.get('/history/my-activities/by-date', { params });
    return response.data;
};

/**
 * Lấy hoạt động gần đây (today, week, month)
 */
export const getRecentActivities = async (range = 'week') => {
    const response = await apiClient.get('/history/my-activities/recent', {
        params: { range }
    });
    return response.data;
};

/**
 * Lấy lịch sử theo entity cụ thể (ví dụ: paper ID)
 */
export const getActivitiesByEntity = async (entityId) => {
    const response = await apiClient.get('/history/my-activities/by-entity', {
        params: { entityId }
    });
    return response.data;
};

/**
 * Lấy thống kê số lượng hoạt động
 */
export const getActivityStats = async () => {
    const response = await apiClient.get('/history/my-activities/stats');
    return response.data;
};

export default {
    getMyActivities,
    getActivitiesByType,
    getActivitiesByGroup,
    getActivitiesByDateRange,
    getRecentActivities,
    getActivitiesByEntity,
    getActivityStats
};
