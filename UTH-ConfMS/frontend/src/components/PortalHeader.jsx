import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserProfileDropdown from "./UserProfileDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import logoUTH from "../assets/logoUTH.jpg";
import "../styles/PortalHeader.css";

/**
 * Reusable portal header used across public/author pages (except homepage).
 * Matches the ConferenceList header styling for consistency.
 */
const PortalHeader = ({
  title,
  subtitle,
  ctaHref = "/author/dashboard",
}) => {
  const { t } = useTranslation();

  const displayTitle = title || t('components.portalHeader.title', { defaultValue: "UTH Conference Portal" });
  const displaySubtitle = subtitle || t('components.portalHeader.subtitle', { defaultValue: "University of Transport HCMC" });

  return (
    <header className="dash-header">
      <div className="dash-header-left">
        <Link to="/" className="portal-brand">
          <img src={logoUTH} alt="UTH logo" className="portal-logo-small" />
          <div>
            <div className="dash-logo-text">{displayTitle}</div>
            <div className="dash-logo-sub">{displaySubtitle}</div>
          </div>
        </Link>
      </div>

      <nav className="portal-nav">
        <Link to="/" className="nav-link">
          {t('nav.home')}
        </Link>
        <Link to="/program" className="nav-link">
          {t('nav.program')}
        </Link>
        <Link to={ctaHref} className="btn-dashboard-nav">
          {t('nav.authorPortal')} <span></span>
        </Link>
        <LanguageSwitcher />
        <UserProfileDropdown />
      </nav>
    </header>
  );
};

export default PortalHeader;
