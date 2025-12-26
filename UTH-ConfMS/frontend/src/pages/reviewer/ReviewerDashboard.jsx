// src/pages/reviewer/ReviewerDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { 
  FiFileText, 
  FiEdit3, 
  FiMessageSquare, 
  FiAlertCircle,
  FiArrowRight 
} from "react-icons/fi";
import "../../styles/ReviewerDashboard.css";

const ReviewerDashboard = () => {
  const dashboardCards = [
    {
      id: 1,
      icon: <FiFileText />,
      title: "Bài được phân công",
      description: "Danh sách submission bạn đang phụ trách phản biện, cùng với deadline review, số lượng review tối thiểu và trạng thái đã/ chưa gửi nhận xét.",
      link: "/reviewer/assignments",
      buttonText: "Mở danh sách assignment",
      color: "teal",
      gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
      primary: true
    },
    {
      id: 2,
      icon: <FiEdit3 />,
      title: "Form review & điểm số",
      description: "Gửi điểm (scores), nhận xét chi tiết, khuyến nghị (accept / reject / borderline) theo form chuẩn của hội nghị.",
      link: "/reviewer/assignments",
      buttonText: "Vào form review",
      color: "blue",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"
    },
    {
      id: 3,
      icon: <FiMessageSquare />,
      title: "Thảo luận nội bộ PC",
      description: "Tham gia thảo luận private giữa các PC cho từng bài: hỏi đáp, tranh luận, điều chỉnh nhận xét trước khi Chair đưa ra quyết định cuối.",
      link: "/reviewer/discussions",
      buttonText: "Mở thread thảo luận",
      color: "cyan",
      gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)"
    },
    {
      id: 4,
      icon: <FiAlertCircle />,
      title: "COI & Bidding (tuỳ chọn)",
      description: "Khai báo và cập nhật xung đột lợi ích (COI), xem danh sách bài được phân công để chuẩn bị cho việc review.",
      link: "/reviewer/coi",
      buttonText: "Quản lý COI & bidding",
      color: "amber",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Bảng điều khiển Reviewer / PC member"
      subtitle="Nhận bài được phân công, gửi điểm &amp; nhận xét, tham gia thảo luận nội bộ PC và xử lý COI."
    >
      <div className="reviewer-dashboard-grid">
        {dashboardCards.map((card) => (
          <div key={card.id} className={`reviewer-card reviewer-card-${card.color}`}>
            <div className="reviewer-card-icon-wrapper">
              <div 
                className="reviewer-card-icon"
                style={{ background: card.gradient }}
              >
                {card.icon}
              </div>
            </div>
            <div className="reviewer-card-content">
              <h3 className="reviewer-card-title">{card.title}</h3>
              <p className="reviewer-card-description">{card.description}</p>
              <Link to={card.link} className={`reviewer-card-button ${card.primary ? 'primary' : ''}`}>
                {card.buttonText}
                <FiArrowRight className="reviewer-button-icon" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ReviewerDashboard;
