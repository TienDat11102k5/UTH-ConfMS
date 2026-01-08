import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "./UserProfileDropdown";
import logoUTH from "../assets/logoUTH.jpg";
import "../styles/PortalHeader.css";

/**
 * Reusable portal header used across public/author pages (except homepage).
 * Matches the ConferenceList header styling for consistency.
 */
const PortalHeader = ({
  title = "UTH Conference Portal",
  subtitle = "University of Transport HCMC",
  ctaHref = "/author/dashboard",
  ctaText = "Cổng thông tin Tác giả",
}) => {
  return (
    <header className="dash-header">
      <div className="dash-header-left">
        <Link to="/" className="portal-brand">
          <img src={logoUTH} alt="UTH logo" className="portal-logo-small" />
          <div>
            <div className="dash-logo-text">{title}</div>
            <div className="dash-logo-sub">{subtitle}</div>
          </div>
        </Link>
      </div>

      <nav className="portal-nav">
        <Link to="/" className="nav-link">
          Trang chủ
        </Link>
        <Link to="/program" className="nav-link">
          Chương trình
        </Link>
        <Link to={ctaHref} className="btn-dashboard-nav">
          {ctaText} <span></span>
        </Link>
        <UserProfileDropdown />
      </nav>
    </header>
  );
};

export default PortalHeader;
