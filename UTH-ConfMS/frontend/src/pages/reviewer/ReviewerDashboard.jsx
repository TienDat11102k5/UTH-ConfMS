// src/pages/reviewer/ReviewerDashboard.jsx
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
  const mainCard = {
    id: 1,
    icon: <FiFileText />,
    title: "Bài báo được phân công phản biện",
    description: "Danh sách các bài báo khoa học mà bạn đang phụ trách phản biện, bao gồm thông tin về thời hạn phản biện, số lượng đánh giá tối thiểu yêu cầu và trạng thái hoàn thành nhận xét của bạn.",
    link: "/reviewer/assignments",
    buttonText: "Xem danh sách bài được phân công",
    color: "teal",
    gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    primary: true
  };

  const secondaryCards = [
    {
      id: 2,
      icon: <FiEdit3 />,
      title: "Biểu mẫu phản biện & chấm điểm",
      description: "Gửi điểm đánh giá, nhận xét chi tiết và khuyến nghị quyết định (chấp nhận / từ chối / cân nhắc) theo biểu mẫu chuẩn của hội nghị.",
      link: "/reviewer/assignments",
      buttonText: "Vào biểu mẫu phản biện",
      color: "blue",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"
    },
    {
      id: 3,
      icon: <FiMessageSquare />,
      title: "Thảo luận nội bộ Ban chương trình",
      description: "Tham gia thảo luận riêng tư giữa các thành viên Ban chương trình cho từng bài báo: trao đổi ý kiến, tranh luận và điều chỉnh nhận xét trước khi Chủ tịch đưa ra quyết định cuối cùng.",
      link: "/reviewer/discussions",
      buttonText: "Mở diễn đàn thảo luận",
      color: "cyan",
      gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)"
    },
    {
      id: 4,
      icon: <FiAlertCircle />,
      title: "Xung đột lợi ích & Đăng ký phản biện",
      description: "Khai báo và cập nhật các trường hợp xung đột lợi ích, xem danh sách bài báo được phân công để chuẩn bị cho quá trình phản biện.",
      link: "/reviewer/coi",
      buttonText: "Quản lý xung đột lợi ích",
      color: "amber",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Hội đồng Khoa học"
      title="Cổng thông tin Phản biện viên"
      subtitle="Quản lý bài phản biện, gửi đánh giá và tham gia thảo luận Ban chương trình."
    >
      {/* Main Card - Full Width */}
      <div className="reviewer-main-card-wrapper">
        <div className={`reviewer-card reviewer-card-main reviewer-card-${mainCard.color}`}>
          <div className="reviewer-card-icon-wrapper">
            <div 
              className="reviewer-card-icon"
              style={{ background: mainCard.gradient }}
            >
              {mainCard.icon}
            </div>
          </div>
          <div className="reviewer-card-content">
            <h3 className="reviewer-card-title">{mainCard.title}</h3>
            <p className="reviewer-card-description">{mainCard.description}</p>
            <Link to={mainCard.link} className="reviewer-card-button primary">
              {mainCard.buttonText}
              <FiArrowRight className="reviewer-button-icon" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Cards - 3 columns */}
      <div className="reviewer-dashboard-grid">
        {secondaryCards.map((card) => (
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
              <Link to={card.link} className="reviewer-card-button">
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
