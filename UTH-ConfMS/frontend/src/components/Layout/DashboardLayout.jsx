// src/components/Layout/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "../UserProfileDropdown";
import NavDropdown from "../NavDropdown";
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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const adminMenuItems = [
    { icon: "FiUsers", text: "Quản lý người dùng", link: "/admin/users" },
    { icon: "FiSettings", text: "Quản lý hội nghị", link: "/admin/conferences" },
    { icon: "FiShield", text: "AI Governance", link: "/admin/ai-governance" },
    { icon: "FiFileText", text: "Backup & Restore", link: "/admin/backup" }
  ];

  const chairMenuItems = [
    { icon: "FiSettings", text: "Cấu hình CFP", link: "/chair/conferences" },
    { icon: "FiUsers", text: "Phân công phản biện", link: "/chair/assignments" },
    { icon: "FiFileText", text: "Quyết định kết quả", link: "/chair/decisions" },
    { icon: "FiTrendingUp", text: "Tiến độ phản biện", link: "/chair/progress" },
    { icon: "FiBook", text: "Kỷ yếu hội nghị", link: "/chair/proceedings" }
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
              Trang hội nghị
            </Link>

            {showAdminNav && (
              <NavDropdown label="Admin" items={adminMenuItems} />
            )}

            {showChairNav && (
              <NavDropdown label="Hội nghị" items={chairMenuItems} />
            )}

            <UserProfileDropdown />
          </nav>
        </header>

        {/* GREETING SECTION - Only show for Author pages */}
        {showGreeting && currentUser && (
          <section className="author-greeting">
            <div className="greeting-content">
              <h2 className="greeting-title">
                Chào bạn, <span className="greeting-name">{currentUser.fullName || currentUser.name || currentUser.email}</span>! 👋
              </h2>
              <p className="greeting-subtitle">
                Chúc bạn một ngày làm việc hiệu quả và tràn đầy cảm hứng nghiên cứu
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
