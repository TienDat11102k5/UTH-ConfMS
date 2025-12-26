// src/pages/chair/ChairDashboard.jsx
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { 
  FiSettings, 
  FiUserCheck, 
  FiCheckCircle, 
  FiBarChart2, 
  FiFileText, 
  FiBook,
  FiArrowRight 
} from "react-icons/fi";
import "../../styles/ChairDashboard.css";

const ChairDashboard = () => {
  const dashboardCards = [
    {
      id: 1,
      icon: <FiSettings />,
      title: "Conference & CFP setup",
      description: "Quản lý thông tin hội nghị, tạo Call for Papers, cấu hình tracks / topics, deadlines và các mẫu email (invitation, reminder, decision).",
      link: "/chair/conferences",
      buttonText: "Cấu hình CFP & tracks",
      color: "purple",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: 2,
      icon: <FiUserCheck />,
      title: "Assignment & tiến độ review",
      description: "Thực hiện assign Reviewer/PC cho từng bài (thủ công hoặc dựa trên gợi ý), theo dõi tiến độ review, SLA và các bài bị trễ hạn.",
      link: "/chair/assignments",
      buttonText: "Quản lý assignment",
      color: "blue",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
    },
    {
      id: 3,
      icon: <FiCheckCircle />,
      title: "Decision & thông báo",
      description: "Tổng hợp điểm và nhận xét, ghi quyết định Accept / Reject, xử lý borderline, gửi email thông báo hàng loạt với phần feedback ẩn danh.",
      link: "/chair/decisions",
      buttonText: "Màn hình quyết định",
      color: "green",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    },
    {
      id: 4,
      icon: <FiBarChart2 />,
      title: "Theo dõi tiến độ",
      description: "Xem tổng quan tiến độ review, số lượng assignment đã hoàn thành, đang chờ và các thống kê khác.",
      link: "/chair/progress",
      buttonText: "Xem tiến độ review",
      color: "orange",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)"
    },
    {
      id: 5,
      icon: <FiFileText />,
      title: "Báo cáo & Export",
      description: "Xem báo cáo tổng hợp, thống kê theo track, export dữ liệu cho chương trình & kỷ yếu (program / proceedings).",
      link: "/chair/reports",
      buttonText: "Xem báo cáo",
      color: "teal",
      gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
    },
    {
      id: 6,
      icon: <FiBook />,
      title: "Proceedings",
      description: "Xem trước danh sách kỷ yếu, kiểm tra các bài báo đã được chấp nhận, và export proceedings dạng JSON.",
      link: "/chair/proceedings",
      buttonText: "Xem Proceedings",
      color: "indigo",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Bảng điều khiển Program / Track Chair"
      subtitle="Cấu hình conference & CFP, phân công bài, theo dõi tiến độ review và đưa ra quyết định cuối cùng."
    >
      <div className="chair-dashboard-grid">
        {dashboardCards.map((card) => (
          <div key={card.id} className={`chair-card chair-card-${card.color}`}>
            <div className="chair-card-header">
              <div 
                className="chair-card-icon"
                style={{ background: card.gradient }}
              >
                {card.icon}
              </div>
              <h3 className="chair-card-title">{card.title}</h3>
            </div>
            <p className="chair-card-description">{card.description}</p>
            <Link to={card.link} className="chair-card-button">
              {card.buttonText}
              <FiArrowRight className="chair-button-icon" />
            </Link>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ChairDashboard;
