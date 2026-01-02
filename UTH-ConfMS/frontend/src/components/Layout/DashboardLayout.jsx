// src/components/Layout/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "../UserProfileDropdown";
import NavDropdown from "../NavDropdown";
import logoUTH from "../../assets/logoUTH.jpg";
import { getCurrentUser } from "../../auth";

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
            <div className="dash-logo-mark">
              <img src={logoUTH} alt="UTH logo" className="dash-logo-img" />
            </div>
            <div>
              <div className="dash-logo-text">UTH-ConfMS · {roleLabel}</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                HỆ THỐNG QUẢN LÝ BÀI BÁO HỘI NGHỊ KHOA HỌC UTH
              </div>
            </div>
          </div>

          <nav className="dash-header-right">
            <Link to="/conferences" className="nav-link">
              CỔNG THÔNG TIN
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
