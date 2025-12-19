// src/pages/chair/ChairDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import apiClient from "../../apiClient";

const ChairDashboard = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);

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

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Bảng điều khiển Program / Track Chair"
      subtitle="Cấu hình conference &amp; CFP, phân công bài, theo dõi tiến độ review và đưa ra quyết định cuối cùng."
    >
      {selectedConference && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <label style={{ marginRight: "1rem" }}>Chọn hội nghị:</label>
          <select
            value={selectedConference}
            onChange={(e) => setSelectedConference(parseInt(e.target.value))}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
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

      <div className="dash-grid">
        <div className="dash-card">
          <h3>Conference &amp; CFP setup</h3>
          <p>
            Quản lý thông tin hội nghị, tạo Call for Papers, cấu hình tracks /
            topics, deadlines và các mẫu email (invitation, reminder, decision).
          </p>
          <Link to="/chair/conferences" className="btn-primary">
            Cấu hình CFP &amp; tracks
          </Link>
        </div>

        <div className="dash-card">
          <h3>Assignment &amp; tiến độ review</h3>
          <p>
            Thực hiện assign Reviewer/PC cho từng bài (thủ công hoặc dựa trên
            gợi ý), theo dõi tiến độ review, SLA và các bài bị trễ hạn.
          </p>
          {selectedConference && (
            <Link
              to={`/chair/assignments/${selectedConference}`}
              className="btn-secondary"
            >
              Quản lý assignment
            </Link>
          )}
        </div>

        <div className="dash-card">
          <h3>Decision &amp; thông báo</h3>
          <p>
            Tổng hợp điểm và nhận xét, ghi quyết định Accept / Reject, xử lý
            borderline, gửi email thông báo hàng loạt với phần feedback ẩn danh.
          </p>
          {selectedConference && (
            <Link
              to={`/chair/decisions/${selectedConference}`}
              className="btn-secondary"
            >
              Màn hình quyết định
            </Link>
          )}
        </div>

        <div className="dash-card">
          <h3>Theo dõi tiến độ</h3>
          <p>
            Xem tổng quan tiến độ review, số lượng assignment đã hoàn thành,
            đang chờ và các thống kê khác.
          </p>
          {selectedConference && (
            <Link
              to={`/chair/progress/${selectedConference}`}
              className="btn-secondary"
            >
              Xem tiến độ review
            </Link>
          )}
        </div>

        <div className="dash-card">
          <h3>Báo cáo &amp; Export</h3>
          <p>
            Xem báo cáo tổng hợp, thống kê theo track, export dữ liệu cho chương
            trình &amp; kỷ yếu (program / proceedings).
          </p>
          {selectedConference && (
            <Link
              to={`/chair/reports/${selectedConference}`}
              className="btn-secondary"
            >
              Xem báo cáo
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChairDashboard;
