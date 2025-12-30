// src/pages/chair/ChairReports.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import "../../styles/ChairReports.css";

const ChairReports = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [conferenceReport, setConferenceReport] = useState(null);
  const [trackReport, setTrackReport] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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
    const loadReports = async () => {
      if (!selectedConference) return;

      try {
        setLoading(true);

        const [confRes, trackRes, progressRes] = await Promise.all([
          apiClient.get(`/reports/conference/${selectedConference}`),
          apiClient.get(`/reports/conference/${selectedConference}/tracks`),
          apiClient.get(
            `/reports/conference/${selectedConference}/review-progress`
          ),
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
    loadReports();
  }, [selectedConference]);

  const handleExportProceedings = async () => {
    if (!selectedConference) {
      alert("Vui lòng chọn hội nghị!");
      return;
    }
    try {
      const res = await apiClient.get(
        `/proceedings/export/${selectedConference}`
      );
      const data = JSON.stringify(res.data, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proceedings-${selectedConference}-${
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
      showChairNav={true}
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

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="report-tabs">
        <button
          onClick={() => setActiveTab("overview")}
          className={activeTab === "overview" ? "active" : ""}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tracks")}
          className={activeTab === "tracks" ? "active" : ""}
        >
          Theo Track
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          className={activeTab === "progress" ? "active" : ""}
        >
          Tiến độ Review
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && conferenceReport && (
        <div className="dash-grid">
          <div className="dash-card">
            <h3>Tổng số bài nộp</h3>
            <div className="stat-blue">
              {conferenceReport.totalSubmissions || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã chấp nhận</h3>
            <div className="stat-green">
              {conferenceReport.accepted || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã từ chối</h3>
            <div className="stat-red">
              {conferenceReport.rejected || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đang review</h3>
            <div className="stat-orange">
              {conferenceReport.underReview || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Tỷ lệ chấp nhận</h3>
            <div className="stat-indigo">
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
                    <td><strong>{trackName}</strong></td>
                    <td>{stats.total || 0}</td>
                    <td className="text-green">{stats.accepted || 0}</td>
                    <td className="text-red">{stats.rejected || 0}</td>
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
            <div className="stat-blue">
              {progressReport.totalAssignments || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã hoàn thành</h3>
            <div className="stat-green">
              {progressReport.completed || 0}
            </div>
            <div className="completion-rate">
              {progressReport.completionRate?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="dash-card">
            <h3>Đang chờ</h3>
            <div className="stat-orange">
              {progressReport.pending || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã chấp nhận</h3>
            <div className="stat-indigo">
              {progressReport.accepted || 0}
            </div>
          </div>
          <div className="dash-card">
            <h3>Đã từ chối</h3>
            <div className="stat-red">
              {progressReport.declined || 0}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairReports;
