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

  useEffect(() => {
    apiClient.get("/conferences").then((res) => {
      setConferences(res.data || []);
      if (res.data?.length) setSelectedConference(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedConference) return;
    setLoading(true);

    Promise.all([
      apiClient.get(`/reports/conference/${selectedConference}`),
      apiClient.get(`/reports/conference/${selectedConference}/tracks`),
      apiClient.get(
        `/reports/conference/${selectedConference}/review-progress`
      ),
    ])
      .then(([c, t, p]) => {
        setConferenceReport(c.data);
        setTrackReport(t.data);
        setProgressReport(p.data);
      })
      .catch(() => setError("Không thể tải báo cáo"))
      .finally(() => setLoading(false));
  }, [selectedConference]);

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title="Báo cáo">
        <div className="loading">Đang tải dữ liệu...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Báo cáo & Thống kê"
      subtitle="Theo dõi tình trạng hội nghị"
      showChairNav
    >
      <div className="report-header">
        <h2>Báo cáo tổng hợp</h2>

        <select
          value={selectedConference || ""}
          onChange={(e) => setSelectedConference(Number(e.target.value))}
        >
          {conferences.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Tabs */}
      <div className="report-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Tổng quan
        </button>
        <button
          className={activeTab === "tracks" ? "active" : ""}
          onClick={() => setActiveTab("tracks")}
        >
          Theo Track
        </button>
        <button
          className={activeTab === "progress" ? "active" : ""}
          onClick={() => setActiveTab("progress")}
        >
          Tiến độ Review
        </button>
      </div>

      {/* Overview */}
      {activeTab === "overview" && conferenceReport && (
        <div className="stat-grid">
          <StatCard title="Bài nộp" value={conferenceReport.totalSubmissions} />
          <StatCard
            title="Chấp nhận"
            value={conferenceReport.accepted}
            color="green"
          />
          <StatCard
            title="Từ chối"
            value={conferenceReport.rejected}
            color="red"
          />
          <StatCard
            title="Đang review"
            value={conferenceReport.underReview}
            color="orange"
          />
          <StatCard
            title="Tỷ lệ chấp nhận"
            value={`${conferenceReport.acceptanceRate?.toFixed(1)}%`}
            color="indigo"
          />
        </div>
      )}

      {/* Tracks */}
      {activeTab === "tracks" && trackReport && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Track</th>
                <th>Tổng</th>
                <th>Chấp nhận</th>
                <th>Từ chối</th>
                <th>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(trackReport.tracks || {}).map(
                ([name, s]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{s.total}</td>
                    <td className="text-green">{s.accepted}</td>
                    <td className="text-red">{s.rejected}</td>
                    <td>{s.acceptanceRate?.toFixed(1)}%</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Progress */}
      {activeTab === "progress" && progressReport && (
        <div className="stat-grid">
          <StatCard title="Assignment" value={progressReport.totalAssignments} />
          <StatCard
            title="Hoàn thành"
            value={progressReport.completed}
            color="green"
            sub={`${progressReport.completionRate?.toFixed(1)}%`}
          />
          <StatCard
            title="Đang chờ"
            value={progressReport.pending}
            color="orange"
          />
          <StatCard
            title="Đã chấp nhận"
            value={progressReport.accepted}
            color="indigo"
          />
          <StatCard
            title="Từ chối"
            value={progressReport.declined}
            color="red"
          />
        </div>
      )}
    </DashboardLayout>
  );
};

const StatCard = ({ title, value, color, sub }) => (
  <div className={`stat-card ${color || ""}`}>
    <span>{title}</span>
    <strong>{value ?? 0}</strong>
    {sub && <em>{sub}</em>}
  </div>
);

export default ChairReports;
