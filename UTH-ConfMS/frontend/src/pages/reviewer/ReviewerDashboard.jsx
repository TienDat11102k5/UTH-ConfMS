// src/pages/reviewer/ReviewerDashboard.jsx
import React from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";

const ReviewerDashboard = () => {
  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Bảng điều khiển Reviewer / PC member"
      subtitle="Nhận bài được phân công, gửi điểm &amp; nhận xét, tham gia thảo luận nội bộ PC và xử lý COI."
    >
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Bài được phân công</h3>
          <p>
            Danh sách submission bạn đang phụ trách phản biện, cùng với deadline
            review, số lượng review tối thiểu và trạng thái đã/ chưa gửi nhận xét.
          </p>
          <button className="btn-primary">
            Mở danh sách assignment
          </button>
        </div>

        <div className="dash-card">
          <h3>Form review &amp; điểm số</h3>
          <p>
            Gửi điểm (scores), nhận xét chi tiết, khuyến nghị (accept / reject /
            borderline) theo form chuẩn của hội nghị.
          </p>
          <button className="btn-secondary">
            Vào form review
          </button>
        </div>

        <div className="dash-card">
          <h3>Thảo luận nội bộ PC</h3>
          <p>
            Tham gia thảo luận private giữa các PC cho từng bài: hỏi đáp, tranh
            luận, điều chỉnh nhận xét trước khi Chair đưa ra quyết định cuối.
          </p>
          <button className="btn-secondary">
            Mở thread thảo luận
          </button>
        </div>

        <div className="dash-card">
          <h3>COI &amp; Bidding (tuỳ chọn)</h3>
          <p>
            Khai báo và cập nhật xung đột lợi ích (COI), xem gợi ý bài phù hợp
            từ topic/keyword embeddings phục vụ bidding (chỉ là gợi ý, không auto-assign).
          </p>
          <button className="btn-secondary">
            Quản lý COI &amp; bidding
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReviewerDashboard;
