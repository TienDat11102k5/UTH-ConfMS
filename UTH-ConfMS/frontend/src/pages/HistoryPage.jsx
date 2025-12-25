// src/pages/HistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import HistoryItem from '../components/HistoryItem';
import * as historyApi from '../api/historyApi';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import './HistoryPage.css';

const HistoryPage = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, paper, review, system
    const [timeRange, setTimeRange] = useState('all'); // all, today, week, month
    const [stats, setStats] = useState(null);

    // Pagination
    const { currentPage, setCurrentPage, totalPages, paginatedItems } =
        usePagination(activities, 20);

    // Load stats on mount
    useEffect(() => {
        loadStats();
    }, []);

    // Helper to filter activities by group on client side
    const filterByGroup = useCallback((activities, group) => {
        if (!Array.isArray(activities)) return [];

        const groupTypes = {
            paper: ['SUBMIT_PAPER', 'EDIT_PAPER', 'WITHDRAW_PAPER', 'UPLOAD_CAMERA_READY'],
            review: ['VIEW_REVIEW', 'SUBMIT_REVIEW', 'UPDATE_REVIEW'],
            system: ['LOGIN', 'LOGOUT', 'UPDATE_PROFILE', 'CHANGE_PASSWORD']
        };

        const types = groupTypes[group] || [];
        return activities.filter(activity => types.includes(activity.activityType));
    }, []);

    const loadActivities = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let data;

            // Apply filters
            if (timeRange !== 'all' && filter === 'all') {
                // Time range only
                data = await historyApi.getRecentActivities(timeRange);
            } else if (filter !== 'all' && timeRange === 'all') {
                // Group filter only
                data = await historyApi.getActivitiesByGroup(filter);
            } else if (filter !== 'all' && timeRange !== 'all') {
                // Both filters - get by time first, then filter by group on client side
                const allData = await historyApi.getRecentActivities(timeRange);
                // Filter by group on client side
                data = filterByGroup(allData, filter);
            } else {
                // No filters
                data = await historyApi.getMyActivities();
            }

            setActivities(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading activities:', err);
            setError('Không thể tải lịch sử hoạt động. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [filter, timeRange, filterByGroup]);

    // Load activities on mount and when filters change
    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const loadStats = async () => {
        try {
            const statsData = await historyApi.getActivityStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const handleTimeRangeChange = (newRange) => {
        setTimeRange(newRange);
    };

    return (
        <div className="history-page">
            <div className="history-container">
                {/* Header */}
                <div className="history-header">
                    <h1>Lịch Sử Hoạt Động</h1>
                    <p className="history-subtitle">
                        Theo dõi tất cả các hoạt động của bạn trong hệ thống
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalActivities}</div>
                                <div className="stat-label">Tổng hoạt động</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📄</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.paperActivities}</div>
                                <div className="stat-label">Hoạt động bài viết</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.reviewActivities}</div>
                                <div className="stat-label">Hoạt động review</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔐</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.loginCount}</div>
                                <div className="stat-label">Lần đăng nhập</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="history-filters">
                    <div className="filter-group">
                        <label>Loại hoạt động:</label>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('all')}
                            >
                                Tất cả
                            </button>
                            <button
                                className={`filter-btn ${filter === 'paper' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('paper')}
                            >
                                📄 Bài viết
                            </button>
                            <button
                                className={`filter-btn ${filter === 'review' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('review')}
                            >
                                📝 Review
                            </button>
                            <button
                                className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('system')}
                            >
                                🔐 Hệ thống
                            </button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Thời gian:</label>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${timeRange === 'all' ? 'active' : ''}`}
                                onClick={() => handleTimeRangeChange('all')}
                            >
                                Tất cả
                            </button>
                            <button
                                className={`filter-btn ${timeRange === 'today' ? 'active' : ''}`}
                                onClick={() => handleTimeRangeChange('today')}
                            >
                                Hôm nay
                            </button>
                            <button
                                className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`}
                                onClick={() => handleTimeRangeChange('week')}
                            >
                                7 ngày
                            </button>
                            <button
                                className={`filter-btn ${timeRange === 'month' ? 'active' : ''}`}
                                onClick={() => handleTimeRangeChange('month')}
                            >
                                30 ngày
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="history-timeline">
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải lịch sử...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={loadActivities} className="retry-btn">
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && activities.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>Chưa có hoạt động nào</h3>
                            <p>Lịch sử hoạt động của bạn sẽ hiển thị ở đây</p>
                        </div>
                    )}

                    {!loading && !error && activities.length > 0 && (
                        <>
                            <div className="timeline-list">
                                {paginatedItems.map((activity) => (
                                    <HistoryItem key={activity.id} activity={activity} />
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={activities.length}
                                itemsPerPage={20}
                                onPageChange={setCurrentPage}
                                itemName="hoạt động"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
