// src/pages/author/AuthorDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { StatsSkeleton } from "../../components/LoadingSkeleton";
import "../../styles/AuthorPages.css";

const AuthorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    underReview: 0,
    accepted: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/submissions");
        const submissions = Array.isArray(res.data) ? res.data : [];

        const underReview = submissions.filter(
          s => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW"
        ).length;

        const accepted = submissions.filter(
          s => s.status === "ACCEPTED"
        ).length;

        setStats({
          underReview,
          accepted,
          total: submissions.length,
        });
      } catch (err) {
        console.error("Error loading stats", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <DashboardLayout
      roleLabel="Author"
      title={t('author.dashboard.title')}
      subtitle={t('author.dashboard.subtitle')}
      showGreeting={true}
    >
      <div className="dash-grid">
        <div className="dash-card author-card-primary">
          <div className="card-number">01</div>
          <h3>{t('author.dashboard.newSubmission')}</h3>
          <p>
            {t('author.form.uploadPdfHint')}
          </p>
          <Link to="/author/submit" className="btn-primary btn-card-action">
            {t('author.submissions.newSubmission')}
          </Link>
        </div>

        <div className="dash-card author-card-secondary">
          <div className="card-number">02</div>
          <h3>{t('author.submissions.title')}</h3>
          <p>
            {t('author.submissions.subtitle')}
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            {t('author.dashboard.viewSubmissions')}
          </Link>
        </div>

        <div className="dash-card author-card-accent">
          <div className="card-number">03</div>
          <h3>{t('author.reviews.title')}</h3>
          <p>
            {t('author.reviews.subtitle')}
          </p>
          <Link to="/author/submissions" className="btn-secondary btn-card-action">
            {t('author.submissions.viewReviews')}
          </Link>
        </div>

        <div className="dash-card author-card-success">
          <div className="card-number">04</div>
          <h3>{t('author.cameraReady.title')}</h3>
          <p>
            {t('author.cameraReady.instructions')}
          </p>
          <Link to="/author/camera-ready" className="btn-secondary btn-card-action">
            {t('author.cameraReady.submitCameraReady')}
          </Link>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="author-stats-section">
        <h2 className="section-title">{t('admin.dashboard.quickStats')}</h2>
        {loading ? (
          <StatsSkeleton count={3} />
        ) : (
          <div className="stats-grid">
            <div className="stat-card stat-card-warning">
              <div className="stat-value">{stats.underReview}</div>
              <div className="stat-label">{t('common.underReview')}</div>
            </div>
            <div className="stat-card stat-card-success">
              <div className="stat-value">{stats.accepted}</div>
              <div className="stat-label">{t('author.dashboard.acceptedPapers')}</div>
            </div>
            <div className="stat-card stat-card-primary">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">{t('author.dashboard.totalSubmissions')}</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuthorDashboard;
