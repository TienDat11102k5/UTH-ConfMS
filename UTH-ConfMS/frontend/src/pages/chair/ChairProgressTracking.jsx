// src/pages/chair/ChairProgressTracking.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import "../../styles/ChairProgressTracking.css";

const ChairProgressTracking = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConferences = async () => {
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
      if (res.data?.length) setSelectedConference(res.data[0].id);
    };
    loadConferences();
  }, []);

  useEffect(() => {
    if (!selectedConference) return;
    const loadProgress = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/reports/conference/${selectedConference}/review-progress`
        );
        setProgressData(res.data);
      } catch {
        setError("Không thể tải dữ liệu tiến độ.");
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [selectedConference]);

  if (loading)
    return (
      <DashboardLayout title="Theo dõi tiến độ">
        <div className="loading-box">Đang tải dữ liệu phân tích…</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Phân tích tiến độ đánh giá"
      subtitle="Theo dõi và phân tích tiến độ phản biện theo thời gian thực"
    >
      {/* Thanh trên */}
      <div className="analytics-top">
        <h2>Tổng quan đánh giá hội nghị</h2>
        <select
          value={selectedConference}
          onChange={(e) => setSelectedConference(Number(e.target.value))}
        >
          {conferences.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {progressData && (
        <>
          {/* KPI */}
          <div className="kpi-panel">
            <div className="kpi-main">
              <span>Tỷ lệ hoàn thành</span>
              <strong>
                {progressData.completionRate?.toFixed(1) || 0}%
              </strong>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressData.completionRate || 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="kpi-stats">
              <div>
                <label>Tổng số phân công</label>
                <b>{progressData.totalAssignments}</b>
              </div>
              <div>
                <label>Đã hoàn thành</label>
                <b>{progressData.completed}</b>
              </div>
              <div>
                <label>Đang chờ</label>
                <b>{progressData.pending}</b>
              </div>
            </div>
          </div>

          {/* Trạng thái bài viết */}
          <div className="status-board">
            <div className="status accepted">
              <span>Đã chấp nhận</span>
              <b>{progressData.accepted}</b>
            </div>
            <div className="status declined">
              <span>Đã từ chối</span>
              <b>{progressData.declined}</b>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default ChairProgressTracking;
