// src/pages/chair/ChairDashboard.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import LoadingText from "../../components/LoadingText.jsx";
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
  const { t } = useTranslation();

  const dashboardCards = [
    {
      id: 1,
      icon: <FiSettings />,
      title: t('chair.dashboard.cfpConfig'),
      description: t('chair.dashboard.cfpConfigDesc'),
      link: "/chair/conferences",
      buttonText: t('chair.dashboard.configureCfp'),
      color: "purple",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: 2,
      icon: <FiUserCheck />,
      title: t('chair.dashboard.assignments'),
      description: t('chair.dashboard.assignmentsDesc'),
      link: "/chair/assignments",
      buttonText: t('chair.dashboard.manageAssignments'),
      color: "blue",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
    },
    {
      id: 3,
      icon: <FiCheckCircle />,
      title: t('chair.dashboard.decisions'),
      description: t('chair.dashboard.decisionsDesc'),
      link: "/chair/decisions",
      buttonText: t('chair.dashboard.openDecisions'),
      color: "green",
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    },
    {
      id: 4,
      icon: <FiBarChart2 />,
      title: t('chair.dashboard.progress'),
      description: t('chair.dashboard.progressDesc'),
      link: "/chair/progress",
      buttonText: t('chair.dashboard.viewProgress'),
      color: "orange",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)"
    },
    {
      id: 5,
      icon: <FiFileText />,
      title: t('chair.dashboard.reports'),
      description: t('chair.dashboard.reportsDesc'),
      link: "/chair/reports",
      buttonText: t('chair.dashboard.viewReports'),
      color: "teal",
      gradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
    },
    {
      id: 6,
      icon: <FiBook />,
      title: t('chair.dashboard.proceedings'),
      description: t('chair.dashboard.proceedingsDesc'),
      link: "/chair/proceedings",
      buttonText: t('chair.dashboard.viewProceedings'),
      color: "indigo",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
    }
  ];

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.dashboard.title')}
      subtitle={t('chair.dashboard.subtitle')}
      showChairNav={true}
    >
      <div className="chair-dashboard-grid">
        {dashboardCards.map((card) => (
          <div key={card.id} className={`chair-card chair-card-${card.color}`}>
            <div className="chair-card-header">
              <div className="chair-card-icon" style={{ background: card.gradient }}>
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
