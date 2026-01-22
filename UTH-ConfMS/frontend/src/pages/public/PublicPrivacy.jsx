import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PortalHeader from "../../components/PortalHeader";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const PublicPrivacy = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="portal-page">
            <PortalHeader />

            <main className="portal-main">
                {/* Hero Section */}
                <section style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    padding: '4rem 2rem',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    marginBottom: '2rem'
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            position: 'absolute',
                            left: '2rem',
                            top: '2rem',
                            display: 'flex',
                            items: 'center',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(5px)',
                            transition: 'all 0.2s',
                            zIndex: 10
                        }}
                        className="hover:bg-white/20"
                    >
                        <FiArrowLeft /> {t('components.backButton.back')}
                    </button>

                    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                        <div style={{
                            display: 'inline-flex',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '1rem',
                            borderRadius: '50%',
                            marginBottom: '1.5rem'
                        }}>
                            <FiShield size={40} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                            {t('public.privacy.title')}
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                            {t('public.privacy.lastUpdated', { date: new Date().toLocaleDateString() })}
                        </p>
                    </div>
                </section>

                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem 5rem' }}>
                    <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('public.privacy.section1Title')}</h2>
                            <p>{t('public.privacy.section1Text')}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('public.privacy.section2Title')}</h2>
                            <p>{t('public.privacy.section2Text')}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('public.privacy.section3Title')}</h2>
                            <p>{t('public.privacy.section3Text')}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('public.privacy.contactTitle')}</h2>
                            <p>{t('public.privacy.contactText')}</p>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="proceedings-footer">
                <span>
                    © {new Date().getFullYear()} {t('public.privacy.footer')}
                </span>
            </footer>
        </div>
    );
};

export default PublicPrivacy;
