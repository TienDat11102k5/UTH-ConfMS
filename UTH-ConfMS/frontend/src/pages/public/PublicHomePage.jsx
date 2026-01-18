// src/pages/public/PublicHomePage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoUth from "../../assets/logoUTH.jpg";
import UserProfileDropdown from "../../components/UserProfileDropdown";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const PublicHomePage = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
    const userStr = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  const getDashboardLink = () => {
    if (!currentUser) return "/author/dashboard";

    const role = currentUser.role?.toLowerCase();
    if (role === "admin") return "/admin/dashboard";
    if (role === "chair" || role === "pc") return "/chair/dashboard";
    if (role === "reviewer") return "/reviewer/dashboard";
    return "/author/dashboard";
  };

  return (
    <div className="portal-page">
      <div className="portal-header-container">
        <header className="portal-header">
          <div className="portal-logo">
            <img
              src={logoUth}
              alt="UTH Logo"
              className="portal-logo-img"
              style={{
                height: "190px",
                width: "auto",
                marginRight: "0px",
                mixBlendMode: "multiply",
              }}
            />

            <div className="portal-logo-text">
              <div className="portal-logo-title">UTH-CONFMS</div>
              <div className="portal-logo-subtitle">
                {t('public.home.subtitle')}
              </div>
            </div>
          </div>

          <nav className="portal-nav">
            <Link to="/proceedings" className="nav-link">
              {t('public.proceedings.title')}
            </Link>
            <LanguageSwitcher />
            {currentUser ? (
              <UserProfileDropdown />
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="nav-link nav-link-primary">
                  {t('auth.register')}
                </Link>
              </>
            )}
          </nav>
        </header>
      </div>

      <main className="portal-main">
        <section className="portal-hero">
          <div className="portal-hero-left">
            <div className="portal-badge">
              {t('public.home.badge')}
            </div>
            <h1 className="portal-title">
              {t('public.home.title')}
            </h1>
            <p className="portal-description">
              {t('public.home.description')}
            </p>

            <div className="portal-actions">
              {currentUser ? (
                <Link to="/author" className="btn-primary">
                  {t('nav.authorPortal')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary">
                    {t('public.home.loginSystem')}
                  </Link>
                  <Link to="/register" className="btn-secondary">
                    {t('public.home.registerAuthor')}
                  </Link>
                </>
              )}
            </div>

            <p className="portal-note">
              {t('public.home.roleNote')}
            </p>
          </div>

          <div className="portal-hero-right">
            <div className="portal-card-grid">
              <div className="portal-card">
                <div className="portal-card-label">{t('common.author')}</div>
                <h3 className="portal-card-title">
                  {t('public.home.cards.author.title')}
                </h3>
                <p className="portal-card-text">
                  {t('public.home.cards.author.description')}
                </p>
              </div>

              <div className="portal-card">
                <div className="portal-card-label">{t('public.home.cards.reviewer.label')}</div>
                <h3 className="portal-card-title">
                  {t('public.home.cards.reviewer.title')}
                </h3>
                <p className="portal-card-text">
                  {t('public.home.cards.reviewer.description')}
                </p>
              </div>

              <div className="portal-card">
                <div className="portal-card-label">{t('public.home.cards.admin.label')}</div>
                <h3 className="portal-card-title">
                  {t('public.home.cards.admin.title')}
                </h3>
                <p className="portal-card-text">
                  {t('public.home.cards.admin.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-section">
          <h2 className="portal-section-title">{t('public.home.workflow.title')}</h2>
          <div className="portal-timeline">
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">1</div>
              <div className="portal-timeline-content">
                <h3>{t('public.home.workflow.cfp.title')}</h3>
                <p>{t('public.home.workflow.cfp.description')}</p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">2</div>
              <div className="portal-timeline-content">
                <h3>{t('public.home.workflow.submission.title')}</h3>
                <p>{t('public.home.workflow.submission.description')}</p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">3</div>
              <div className="portal-timeline-content">
                <h3>{t('public.home.workflow.review.title')}</h3>
                <p>{t('public.home.workflow.review.description')}</p>
              </div>
            </div>
            <div className="portal-timeline-item">
              <div className="portal-timeline-badge">4</div>
              <div className="portal-timeline-content">
                <h3>{t('public.home.workflow.decision.title')}</h3>
                <p>{t('public.home.workflow.decision.description')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} UTH-ConfMS. {t('public.home.footer')}
        </span>
      </footer>
    </div>
  );
};

export default PublicHomePage;
