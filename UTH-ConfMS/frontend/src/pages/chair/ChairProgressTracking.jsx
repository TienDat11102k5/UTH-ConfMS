// src/pages/chair/ChairProgressTracking.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairProgressTracking = () => {
  const { conferenceId } = useParams();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/reports/conference/${conferenceId}/review-progress`
        );
        setProgressData(res.data);
      } catch (err) {
        console.error("Load progress error:", err);
        setError("Không thể tải dữ liệu tiến độ.");
      } finally {
        setLoading(false);
      }
    };
    if (conferenceId) loadProgress();
  }, [conferenceId]);

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Theo dõi tiến độ">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout roleLabel="Chair" title="Theo dõi tiến độ">
        <div style={{ color: "#d32f2f", padding: "1rem" }}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Theo dõi tiến độ Review"
      subtitle="Xem tổng quan tiến độ review của hội nghị"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Theo dõi tiến độ Review</h2>
        </div>
      </div>

      {progressData && (
        <div className="dash-grid" style={{ marginTop: "2rem" }}>
          <div className="dash-card">
            <h3>Tổng số Assignment</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f62fe" }}
            >
              {progressData.totalAssignments || 0}
            </div>
          </div>

          <div className="dash-card">
            <h3>Đã hoàn thành</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}
            >
              {progressData.completed || 0}
            </div>
            <div style={{ marginTop: "0.5rem", color: "#666" }}>
              {progressData.completionRate?.toFixed(1) || 0}%
            </div>
          </div>

          <div className="dash-card">
            <h3>Đang chờ</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}
            >
              {progressData.pending || 0}
            </div>
          </div>

          <div className="dash-card">
            <h3>Đã chấp nhận</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}
            >
              {progressData.accepted || 0}
            </div>
          </div>

          <div className="dash-card">
            <h3>Đã từ chối</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#d32f2f" }}
            >
              {progressData.declined || 0}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairProgressTracking;
