import React from "react";
import { Link } from "react-router-dom";
import UserProfileDropdown from "./UserProfileDropdown";
import logoUTH from "../assets/logoUTH.jpg";

/**
 * Reusable portal header used across public/author pages (except homepage).
 * Matches the ConferenceList header styling for consistency.
 */
const PortalHeader = ({
  ctaHref = "/author/dashboard",
  ctaText = "Vào Dashboard Tác Giả",
}) => {
  return (
    <header
      className="dash-header"
      style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="dash-header-left">
        <Link to="/" className="portal-brand">
          <img src={logoUTH} alt="UTH logo" className="portal-logo-small" />
          <div>
            <div className="dash-logo-text">UTH Conference Portal</div>
            <div className="dash-logo-sub">University of Transport HCMC</div>
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
          <span></span> {ctaText}
        </Link>
        <UserProfileDropdown />
      </nav>
    </header>
  );
};

export default PortalHeader;
