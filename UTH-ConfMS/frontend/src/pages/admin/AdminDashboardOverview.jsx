// src/pages/admin/AdminDashboardOverview.jsx
import React, { useState, useEffect } from "react";
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

    // Fetch data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all data in parallel
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
                setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <AdminLayout
                title="Tổng quan Hệ thống"
                subtitle="Thống kê và phân tích hoạt động người dùng"
            >
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout
                title="Tổng quan Hệ thống"
                subtitle="Thống kê và phân tích hoạt động người dùng"
            >
                <div className="auth-error" style={{ marginBottom: "2rem" }}>
                    {error}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title="Tổng quan Hệ thống"
            subtitle="Thống kê và phân tích hoạt động người dùng"
        >
            {/* Statistics Cards */}
            <div className="stats-grid">
                {/* Tổng người dùng */}
                <div className="stat-card">
                    <div className="stat-icon total-users">
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-label">Tổng người dùng</h3>
                        <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                        <div
                            className={`stat-trend ${stats.totalUsersTrend >= 0 ? "positive" : "negative"
                                }`}
                        >
                            {stats.totalUsersTrend >= 0 ? (
                                <FiTrendingUp />
                            ) : (
                                <FiTrendingDown />
                            )}
                            <span>
                                {Math.abs(stats.totalUsersTrend)}% so với tháng trước
                            </span>
                        </div>
                    </div>
                </div>

                {/* Người dùng hôm nay */}
                <div className="stat-card">
                    <div className="stat-icon active-users">
                        <FiUserCheck />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-label">Người dùng hôm nay</h3>
                        <div className="stat-value">
                            {stats.todayActiveUsers.toLocaleString()}
                        </div>
                        <div
                            className={`stat-trend ${stats.todayUsersTrend >= 0 ? "positive" : "negative"
                                }`}
                        >
                            {stats.todayUsersTrend >= 0 ? (
                                <FiTrendingUp />
                            ) : (
                                <FiTrendingDown />
                            )}
                            <span>
                                {Math.abs(stats.todayUsersTrend).toFixed(1)}% so với hôm qua
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Người dùng theo tháng */}
                <div className="chart-card">
                    <h3 className="chart-title">Người dùng theo tháng</h3>
                    <p className="chart-subtitle">12 tháng gần nhất</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="month"
                                stroke="#666"
                                style={{ fontSize: "0.875rem" }}
                            />
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
                                name="Số người dùng"
                                stroke="#0f62fe"
                                strokeWidth={3}
                                dot={{ fill: "#0f62fe", r: 5 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Truy cập theo tuần */}
                <div className="chart-card">
                    <h3 className="chart-title">Truy cập theo tuần</h3>
                    <p className="chart-subtitle">7 ngày gần nhất</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="day"
                                stroke="#666"
                                style={{ fontSize: "0.875rem" }}
                            />
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
                                name="Lượt truy cập"
                                fill="#00d9f9"
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
