// src/pages/chair/ChairProgressTracking.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairProgressTracking = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedConference(res.data[0].id);
        }
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      if (!selectedConference) return;
      
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/reports/conference/${selectedConference}/review-progress`
        );
        setProgressData(res.data);
      } catch (err) {
        console.error("Load progress error:", err);
        setError("Không thể tải dữ liệu tiến độ.");
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [selectedConference]);

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

      {/* Conference Selector */}
      {conferences.length > 0 && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <label style={{ marginRight: "1rem", fontWeight: "bold" }}>
            Chọn hội nghị:
          </label>
          <select
            value={selectedConference || ""}
            onChange={(e) => setSelectedConference(parseInt(e.target.value))}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              minWidth: "300px",
            }}
          >
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
