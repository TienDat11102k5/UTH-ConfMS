// src/pages/reviewer/ReviewerDashboard.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import LoadingText from "../../components/LoadingText.jsx";
import {
  FiFileText,
  FiEdit3,
  FiMessageSquare,
  FiAlertCircle,
  FiArrowRight
} from "react-icons/fi";
import "../../styles/ReviewerDashboard.css";

const ReviewerDashboard = () => {
  const { t } = useTranslation();

  const mainCard = {
    id: 1,
    icon: <FiFileText />,
    title: t('reviewer.dashboard.assignedPapers'),
    description: t('reviewer.dashboard.assignedPapersDesc'),
    link: "/reviewer/assignments",
    buttonText: t('reviewer.dashboard.viewAssignments'),
    color: "teal",
    gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    primary: true
  };

  const secondaryCards = [
    {
      id: 2,
      icon: <FiEdit3 />,
      title: t('reviewer.dashboard.reviewForm'),
      description: t('reviewer.dashboard.reviewFormDesc'),
      link: "/reviewer/assignments",
      buttonText: t('reviewer.dashboard.openReviewForm'),
      color: "blue",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)"
    },
    {
      id: 3,
      icon: <FiMessageSquare />,
      title: t('reviewer.dashboard.pcDiscussion'),
      description: t('reviewer.dashboard.pcDiscussionDesc'),
      link: "/reviewer/discussions",
      buttonText: t('reviewer.dashboard.openDiscussion'),
      color: "cyan",
      gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)"
    },
    {
      id: 4,
      icon: <FiAlertCircle />,
      title: t('reviewer.dashboard.coi'),
      description: t('reviewer.dashboard.coiDesc'),
      link: "/reviewer/coi",
      buttonText: t('reviewer.dashboard.manageCoi'),
      color: "amber",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Reviewer"
      title={t('reviewer.dashboard.title')}
      subtitle={t('reviewer.dashboard.subtitle')}
    >
      {/* Main Card - Full Width */}
      <div className="reviewer-main-card-wrapper">
        <div className={`reviewer-card reviewer-card-main reviewer-card-${mainCard.color}`}>
          <div className="reviewer-card-icon-wrapper">
            <div className="reviewer-card-icon" style={{ background: mainCard.gradient }}>
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
              <div className="reviewer-card-icon" style={{ background: card.gradient }}>
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
