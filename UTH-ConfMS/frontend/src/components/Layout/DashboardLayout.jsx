// src/components/Layout/DashboardLayout.jsx
import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "../UserProfileDropdown";
import logoUTH from "../../assets/logoUTH.jpg";

const DashboardLayout = ({
  roleLabel,
  title,
  subtitle,
  children,
  showSidebar = false,
  sidebarContent = null
}) => {
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
                UTH Scientific Conference Paper Management System
              </div>
            </div>
          </div>

          <nav className="dash-header-right">
            <Link to="/" className="nav-link">
              Cổng thông tin
            </Link>
            <UserProfileDropdown />
          </nav>
        </header>

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
