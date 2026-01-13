// src/components/Layout/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserProfileDropdown from "../UserProfileDropdown";
import NavDropdown from "../NavDropdown";
import LanguageSwitcher from "../LanguageSwitcher";
import logoUTH from "../../assets/logoUTH.jpg";
import { getCurrentUser } from "../../auth";
import "../../styles/PortalHeader.css";

const DashboardLayout = ({
  roleLabel,
  title,
  subtitle,
  children,
  showSidebar = false,
  sidebarContent = null,
  showAdminNav = false,
  showChairNav = false,
  showGreeting = false
}) => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const adminMenuItems = [
    { icon: "FiUsers", text: t('admin.menu.userManagement'), link: "/admin/users" },
    { icon: "FiSettings", text: t('admin.menu.conferenceManagement'), link: "/admin/conferences" },
    { icon: "FiShield", text: t('admin.menu.aiGovernance'), link: "/admin/ai-governance" },
    { icon: "FiFileText", text: t('admin.menu.backupRestore'), link: "/admin/backups" }
  ];

  const chairMenuItems = [
    { icon: "FiSettings", text: t('chair.menu.cfpConfig'), link: "/chair/conferences" },
    { icon: "FiUsers", text: t('chair.menu.reviewerAssignment'), link: "/chair/assignments" },
    { icon: "FiFileText", text: t('chair.menu.decisionResult'), link: "/chair/decisions" },
    { icon: "FiTrendingUp", text: t('chair.menu.reviewProgress'), link: "/chair/progress" },
    { icon: "FiBook", text: t('chair.menu.conferenceProceedings'), link: "/chair/proceedings" }
  ];

  return (
    <div className={`dash-page ${showSidebar ? "with-sidebar" : ""}`}>
      {/* SIDEBAR (if enabled) */}
      {showSidebar && sidebarContent}

      <div className="dash-content-wrapper">
        {/* HEADER */}
        <header className="dash-header">
          <div className="dash-header-left">
            <Link to="/" className="portal-brand">
              <img src={logoUTH} alt="UTH logo" className="portal-logo-small" />
              <div>
                <div className="dash-logo-text">
                  UTH Conference Portal{roleLabel ? ` · ${roleLabel}` : ""}
                </div>
                <div className="dash-logo-sub">University of Transport HCMC</div>
              </div>
            </Link>
          </div>

          <nav className="dash-header-right">
            <Link to="/conferences" className="nav-link">
              {t('nav.conferenceList')}
            </Link>

            {showAdminNav && (
              <NavDropdown label="Admin" items={adminMenuItems} />
            )}

            {showChairNav && (
              <NavDropdown label={t('common.conference')} items={chairMenuItems} />
            )}

            <LanguageSwitcher />
            <UserProfileDropdown />
          </nav>
        </header>

        {/* GREETING SECTION - Only show for Author pages */}
        {showGreeting && currentUser && (
          <section className="author-greeting">
            <div className="greeting-content">
              <h2 className="greeting-title">
                {t('greeting.hello')}, <span className="greeting-name">{currentUser.fullName || currentUser.name || currentUser.email}</span>! 👋
              </h2>
              <p className="greeting-subtitle">
                {t('greeting.goodDay')}
              </p>
            </div>
          </section>
        )}

        {/* MAIN */}
        <main className="dash-main">
          <section className="dash-section">
            <h1 className="dash-title">{title}</h1>
            {subtitle && <p className="dash-subtitle">{subtitle}</p>}

            {children}
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
