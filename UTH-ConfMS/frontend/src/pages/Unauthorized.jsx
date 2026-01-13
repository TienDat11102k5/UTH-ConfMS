import React from "react";
import { useTranslation } from "react-i18next";

const UnauthorizedPage = () => {
  const { t } = useTranslation();

  return (
    <main className="unauthorized-page">
      <div className="unauthorized-card">
        <h1>{t('errors.unauthorizedTitle')}</h1>
        <p>
          {t('errors.unauthorizedDescription')}
        </p>
      </div>
    </main>
  );
};

export default UnauthorizedPage;

