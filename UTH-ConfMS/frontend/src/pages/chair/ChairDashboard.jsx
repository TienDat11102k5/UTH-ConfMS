// src/pages/chair/ChairDashboard.jsx
import React from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const ChairDashboard = () => {
  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Bảng điều khiển Program / Track Chair"
      subtitle="Cấu hình conference &amp; CFP, phân công bài, theo dõi tiến độ review và đưa ra quyết định cuối cùng."
    >
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Conference &amp; CFP setup</h3>
          <p>
            Quản lý thông tin hội nghị, tạo Call for Papers, cấu hình tracks /
            topics, deadlines và các mẫu email (invitation, reminder, decision).
          </p>
          <button className="btn-primary">
            Cấu hình CFP &amp; tracks
          </button>
        </div>

        <div className="dash-card">
          <h3>Assignment &amp; tiến độ review</h3>
          <p>
            Thực hiện assign Reviewer/PC cho từng bài (thủ công hoặc dựa trên
            gợi ý), theo dõi tiến độ review, SLA và các bài bị trễ hạn.
          </p>
          <button className="btn-secondary">
            Quản lý assignment
          </button>
        </div>

        <div className="dash-card">
          <h3>Decision &amp; thông báo</h3>
          <p>
            Tổng hợp điểm và nhận xét, ghi quyết định Accept / Reject, xử lý
            borderline, gửi email thông báo hàng loạt với phần feedback ẩn danh.
          </p>
          <button className="btn-secondary">
            Màn hình quyết định
          </button>
        </div>

        <div className="dash-card">
          <h3>Camera-ready &amp; chương trình</h3>
          <p>
            Mở vòng camera-ready, nhận bản cuối, sắp xếp phiên trình bày, export
            dữ liệu cho chương trình &amp; kỷ yếu (program / proceedings).
          </p>
          <button className="btn-secondary">
            Lập chương trình hội nghị
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChairDashboard;
