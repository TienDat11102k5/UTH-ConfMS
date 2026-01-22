import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/EmptyState";
import "../../styles/PublicAcceptedPapers.css";
import "../../styles/PublicProceedings.css";

const PublicAcceptedPapers = () => {
  const { t } = useTranslation();

  return (
    <div className="public-accepted-page">
      <section className="accepted-hero">
        <h1>{t('public.acceptedPapers.title')}</h1>
        <p>
          {t('public.acceptedPapers.description')}
        </p>
      </section>

      <section className="accepted-content">
        <EmptyState
          icon="file"
          title={t('public.acceptedPapers.emptyTitle')}
          description={t('public.acceptedPapers.emptyDescription')}
          size="large"
        />

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link to="/" className="btn-secondary">
            ← {t('public.acceptedPapers.backToPortal')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="proceedings-footer">
        <span>
          © {new Date().getFullYear()} {t('public.acceptedPapers.footer')}
        </span>
      </footer>
    </div>
  );
};

export default PublicAcceptedPapers;

