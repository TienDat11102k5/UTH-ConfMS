// src/pages/chair/ChairReports.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairReports = () => {
  const { conferenceId } = useParams();
  const [conferenceReport, setConferenceReport] = useState(null);
  const [trackReport, setTrackReport] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);

        const [confRes, trackRes, progressRes] = await Promise.all([
          apiClient.get(`/reports/conference/${conferenceId}`),
          apiClient.get(`/reports/conference/${conferenceId}/tracks`),
          apiClient.get(`/reports/conference/${conferenceId}/review-progress`),
        ]);

        setConferenceReport(confRes.data);
        setTrackReport(trackRes.data);
        setProgressReport(progressRes.data);
      } catch (err) {
        console.error("Load reports error:", err);
        setError("Không thể tải báo cáo.");
      } finally {
        setLoading(false);
      }
    };
    if (conferenceId) loadReports();
  }, [conferenceId]);

  const handleExportProceedings = async () => {
    try {
      const res = await apiClient.get(
        `/reports/conference/${conferenceId}/export-proceedings`
      );
      const data = JSON.stringify(res.data, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proceedings-${conferenceId}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi khi export: " + err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Báo cáo">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Báo cáo &amp; Thống kê"
      subtitle="Xem báo cáo tổng hợp và export dữ liệu"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Báo cáo &amp; Thống kê</h2>
        </div>
        <div className="data-page-header-right">
          <button className="btn-primary" onClick={handleExportProceedings}>
            Export Proceedings
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#ffebee",
            border: "1px solid #d32f2f",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "overview" ? "#0f62fe" : "transparent",
            color: activeTab === "overview" ? "white" : "#666",
            cursor: "pointer",
            borderBottom:
              activeTab === "overview" ? "2px solid #0f62fe" : "none",
          }}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tracks")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "tracks" ? "#0f62fe" : "transparent",
            color: activeTab === "tracks" ? "white" : "#666",
            cursor: "pointer",
            borderBottom: activeTab === "tracks" ? "2px solid #0f62fe" : "none",
          }}
        >
          Theo Track
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: activeTab === "progress" ? "#0f62fe" : "transparent",
            color: activeTab === "progress" ? "white" : "#666",
            cursor: "pointer",
            borderBottom:
              activeTab === "progress" ? "2px solid #0f62fe" : "none",
          }}
        >
          Tiến độ Review
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && conferenceReport && (
        <div className="dash-grid">
          <div className="dash-card">
            <h3>Tổng số bài nộp</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f62fe" }}
            >
              {conferenceReport.totalSubmissions || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã chấp nhận</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}
            >
              {conferenceReport.accepted || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã từ chối</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#d32f2f" }}
            >
              {conferenceReport.rejected || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đang review</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}
            >
              {conferenceReport.underReview || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Tỷ lệ chấp nhận</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}
            >
              {conferenceReport.acceptanceRate?.toFixed(1) || 0}%
            </div>
          </div>
        </div>
      )}

      {/* Tracks Tab */}
      {activeTab === "tracks" && trackReport && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Tổng số</th>
                <th>Chấp nhận</th>
                <th>Từ chối</th>
                <th>Tỷ lệ chấp nhận</th>
              </tr>
            </thead>
            <tbody>
              {trackReport.tracks &&
                Object.entries(trackReport.tracks).map(([trackName, stats]) => (
                  <tr key={trackName}>
                    <td>
                      <strong>{trackName}</strong>
                    </td>
                    <td>{stats.total || 0}</td>
                    <td style={{ color: "#2e7d32" }}>{stats.accepted || 0}</td>
                    <td style={{ color: "#d32f2f" }}>{stats.rejected || 0}</td>
                    <td>{stats.acceptanceRate?.toFixed(1) || 0}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === "progress" && progressReport && (
        <div className="dash-grid">
          <div className="dash-card">
            <h3>Tổng Assignment</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f62fe" }}
            >
              {progressReport.totalAssignments || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã hoàn thành</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#2e7d32" }}
            >
              {progressReport.completed || 0}
            </div>
            <div style={{ marginTop: "0.5rem", color: "#666" }}>
              {progressReport.completionRate?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="dash-card">
            <h3>Đang chờ</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}
            >
              {progressReport.pending || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã chấp nhận</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#1976d2" }}
            >
              {progressReport.accepted || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã từ chối</h3>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#d32f2f" }}
            >
              {progressReport.declined || 0}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairReports;
