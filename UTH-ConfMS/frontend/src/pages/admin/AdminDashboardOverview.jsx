// src/pages/admin/AdminDashboardOverview.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import {
    FiUsers,
    FiUserCheck,
    FiTrendingUp,
    FiTrendingDown,
} from "react-icons/fi";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    getDashboardStats,
    getMonthlyUserStats,
    getWeeklyAccessStats,
} from "../../api/admin/dashboardAPI";

const AdminDashboardOverview = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        todayActiveUsers: 0,
        totalUsersTrend: 0,
        todayUsersTrend: 0,
    });

    const [monthlyData, setMonthlyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [statsData, monthlyStats, weeklyStats] = await Promise.all([
                    getDashboardStats(),
                    getMonthlyUserStats(),
                    getWeeklyAccessStats(),
                ]);

                setStats(statsData);
                setMonthlyData(monthlyStats);
                setWeeklyData(weeklyStats);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(t('app.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [t]);

    if (loading) {
        return (
            <AdminLayout title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')}>
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <p>{t('app.loading')}</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')}>
                <div className="auth-error" style={{ marginBottom: "2rem" }}>{error}</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={t('admin.dashboard.title')}>
            {/* Statistics Cards */}
            <div className="stats-grid">
                {/* Total Users */}
                <div className="stat-card">
                    <div className="stat-icon total-users">
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-label">{t('admin.dashboard.totalUsers')}</h3>
                        <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                        <div className={`stat-trend ${stats.totalUsersTrend >= 0 ? "positive" : "negative"}`}>
                            {stats.totalUsersTrend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                            <span>{Math.abs(stats.totalUsersTrend)}% {t('admin.dashboard.vsLastMonth')}</span>
                        </div>
                    </div>
                </div>

                {/* Today's Users */}
                <div className="stat-card">
                    <div className="stat-icon active-users">
                        <FiUserCheck />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-label">{t('admin.dashboard.todayUsers')}</h3>
                        <div className="stat-value">{stats.todayActiveUsers.toLocaleString()}</div>
                        <div className={`stat-trend ${stats.todayUsersTrend >= 0 ? "positive" : "negative"}`}>
                            {stats.todayUsersTrend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                            <span>{Math.abs(stats.todayUsersTrend).toFixed(1)}% {t('admin.dashboard.vsYesterday')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Monthly Users */}
                <div className="chart-card">
                    <h3 className="chart-title">{t('admin.dashboard.monthlyUsers')}</h3>
                    <p className="chart-subtitle">{t('admin.dashboard.last12Months')}</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="month" stroke="#666" style={{ fontSize: "0.875rem" }} />
                            <YAxis stroke="#666" style={{ fontSize: "0.875rem" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="users"
                                name={t('admin.users.title')}
                                stroke="#007173"
                                strokeWidth={3}
                                dot={{ fill: "#007173", r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Access */}
                <div className="chart-card">
                    <h3 className="chart-title">{t('admin.dashboard.weeklyAccess')}</h3>
                    <p className="chart-subtitle">{t('admin.dashboard.last7Days')}</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="day" stroke="#666" style={{ fontSize: "0.875rem" }} />
                            <YAxis stroke="#666" style={{ fontSize: "0.875rem" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="visits"
                                name={t('admin.dashboard.visits')}
                                fill="#007173"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboardOverview;
