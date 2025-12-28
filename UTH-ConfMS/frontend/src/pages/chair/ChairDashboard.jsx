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
      title: "Cấu hình Hội nghị & Call for Papers",
      description: "Quản lý thông tin hội nghị khoa học, tạo và cấu hình Call for Papers (CFP), thiết lập các lĩnh vực/chủ đề nghiên cứu, thời hạn nộp bài và các mẫu email học thuật (thư mời, nhắc hạn, thông báo kết quả).",
      link: "/chair/conferences",
      buttonText: "Cấu hình CFP và chủ đề",
      color: "purple",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: 2,
      icon: <FiUserCheck />,
      title: "Phân công phản biện & theo dõi đánh giá",
      description: "Phân công Reviewer / Program Committee cho từng bài báo (thủ công hoặc dựa trên đề xuất hệ thống), theo dõi tiến độ phản biện, thời hạn đánh giá và các bài nộp phản biện trễ.",
      link: "/chair/assignments",
      buttonText: "Quản lý phân công phản biện",
      color: "blue",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
    },
    {
      id: 3,
      icon: <FiCheckCircle />,
      title: "Quyết định & thông báo kết quả",
      description: "Tổng hợp điểm số và nhận xét phản biện, đưa ra quyết định Chấp nhận / Từ chối, xử lý các bài biên giới và gửi email thông báo kết quả kèm nhận xét ẩn danh.",
      link: "/chair/decisions",
      buttonText: "Giao diện ra quyết định",
      color: "green",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    },
    {
      id: 4,
      icon: <FiBarChart2 />,
      title: "Theo dõi tiến độ phản biện",
      description: "Theo dõi tổng quan tiến độ phản biện, số lượng bài đã hoàn tất đánh giá, đang chờ xử lý và các thống kê phục vụ công tác quản lý hội nghị.",
      link: "/chair/progress",
      buttonText: "Xem tiến độ phản biện",
      color: "orange",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)"
    },
    {
      id: 5,
      icon: <FiFileText />,
      title: "Báo cáo & xuất dữ liệu",
      description: "Xem các báo cáo tổng hợp, thống kê theo lĩnh vực nghiên cứu và xuất dữ liệu phục vụ xây dựng chương trình hội nghị và kỷ yếu.",
      link: "/chair/reports",
      buttonText: "Xem báo cáo tổng hợp",
      color: "teal",
      gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
    },
    {
      id: 6,
      icon: <FiBook />,
      title: "Kỷ yếu hội nghị (Proceedings)",
      description: "Xem trước danh sách kỷ yếu hội nghị, kiểm tra các bài báo đã được chấp nhận và xuất dữ liệu kỷ yếu ở định dạng JSON.",
      link: "/chair/proceedings",
      buttonText: "Xem kỷ yếu hội nghị",
      color: "indigo",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Chủ tịch Chương trình / Chủ tịch Chuyên đề"
      title="Hệ thống Quản lý Hội nghị Khoa học"
      subtitle="Cấu hình hội nghị và Call for Papers, phân công phản biện, theo dõi tiến độ đánh giá và đưa ra quyết định học thuật."
      showChairNav={true}
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
