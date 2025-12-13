// src/components/Layout/DashboardLayout.jsx
import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "../UserProfileDropdown";

const DashboardLayout = ({ roleLabel, title, subtitle, children }) => {
  return (
    <div className="dash-page">
      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-mark">UTH</span>
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
  );
};

export default DashboardLayout;
