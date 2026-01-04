import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { FiActivity, FiFileText, FiMessageSquare, FiLock } from 'react-icons/fi';
import DashboardLayout from '../components/Layout/DashboardLayout';
import HistoryItem from '../components/HistoryItem';
import * as historyApi from '../api/historyApi';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const HistoryPage = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('all');
    const [stats, setStats] = useState(null);

    const { currentPage, setCurrentPage, totalPages, paginatedItems } =
        usePagination(activities, 20);

    // Determine which filters to show based on role
    const getAvailableFilters = () => {
        const roles = user?.roles || [];
        const filters = ['all'];
        
        if (roles.includes('ROLE_AUTHOR')) {
            filters.push('paper');
        }
        if (roles.includes('ROLE_REVIEWER')) {
            filters.push('review');
        }
        filters.push('system');
        
        return filters;
    };

    const availableFilters = getAvailableFilters();

    useEffect(() => {
        loadStats();
    }, []);

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

            if (timeRange !== 'all' && filter === 'all') {
                data = await historyApi.getRecentActivities(timeRange);
            } else if (filter !== 'all' && timeRange === 'all') {
                data = await historyApi.getActivitiesByGroup(filter);
            } else if (filter !== 'all' && timeRange !== 'all') {
                const allData = await historyApi.getRecentActivities(timeRange);
                data = filterByGroup(allData, filter);
            } else {
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

    const renderStatCards = () => {
        if (!stats) return null;

        const roles = user?.roles || [];
        const cards = [];

        // Always show total
        cards.push(
            <div key="total" className="stat-card" style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: '#dbeafe', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <FiActivity size={24} color="#2563eb" />
                </div>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{stats.totalActivities}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng hoạt động</div>
                </div>
            </div>
        );

        // Show paper activities for authors
        if (roles.includes('ROLE_AUTHOR')) {
            cards.push(
                <div key="paper" className="stat-card" style={{
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#dcfce7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <FiFileText size={24} color="#16a34a" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{stats.paperActivities}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hoạt động bài viết</div>
                    </div>
                </div>
            );
        }

        // Show review activities for reviewers
        if (roles.includes('ROLE_REVIEWER')) {
            cards.push(
                <div key="review" className="stat-card" style={{
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: '#fef3c7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <FiMessageSquare size={24} color="#d97706" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{stats.reviewActivities}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hoạt động review</div>
                    </div>
                </div>
            );
        }

        // Always show login count
        cards.push(
            <div key="login" className="stat-card" style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: '#f3e8ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    <FiLock size={24} color="#9333ea" />
                </div>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{stats.loginCount}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lần đăng nhập</div>
                </div>
            </div>
        );

        return cards;
    };

    return (
        <DashboardLayout>
            <div className="data-page-header">
                <div className="data-page-header-left">
                    <div className="breadcrumb">
                        <span className="breadcrumb-current">Lịch sử</span>
                    </div>
                    <h2 className="data-page-title">Lịch Sử Hoạt Động</h2>
                    <p className="data-page-subtitle">
                        Theo dõi tất cả các hoạt động của bạn trong hệ thống
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '1.5rem' 
                }}>
                    {renderStatCards()}
                </div>
            )}

            {/* Filters */}
            <div style={{ 
                background: 'white', 
                padding: '1.25rem', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                marginBottom: '1.5rem'
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Loại hoạt động:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {availableFilters.includes('all') && (
                            <button
                                className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setFilter('all')}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                Tất cả
                            </button>
                        )}
                        {availableFilters.includes('paper') && (
                            <button
                                className={filter === 'paper' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setFilter('paper')}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiFileText size={16} />
                                Bài viết
                            </button>
                        )}
                        {availableFilters.includes('review') && (
                            <button
                                className={filter === 'review' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setFilter('review')}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiMessageSquare size={16} />
                                Review
                            </button>
                        )}
                        {availableFilters.includes('system') && (
                            <button
                                className={filter === 'system' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setFilter('system')}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiLock size={16} />
                                Hệ thống
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Thời gian:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            className={timeRange === 'all' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setTimeRange('all')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            Tất cả
                        </button>
                        <button
                            className={timeRange === 'today' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setTimeRange('today')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            Hôm nay
                        </button>
                        <button
                            className={timeRange === 'week' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setTimeRange('week')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            7 ngày
                        </button>
                        <button
                            className={timeRange === 'month' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setTimeRange('month')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            30 ngày
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#6b7280' }}>Đang tải lịch sử...</p>
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                        <button onClick={loadActivities} className="btn-primary">
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && activities.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            margin: '0 auto 1.5rem', 
                            borderRadius: '50%', 
                            background: '#f3f4f6', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <FiActivity size={40} color="#9ca3af" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                            Chưa có hoạt động nào
                        </h3>
                        <p style={{ color: '#6b7280' }}>Lịch sử hoạt động của bạn sẽ hiển thị ở đây</p>
                    </div>
                )}

                {!loading && !error && activities.length > 0 && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {paginatedItems.map((activity) => (
                                <HistoryItem key={activity.id} activity={activity} />
                            ))}
                        </div>

                        {activities.length > 20 && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={activities.length}
                                    itemsPerPage={20}
                                    onPageChange={setCurrentPage}
                                    itemName="hoạt động"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default HistoryPage;
