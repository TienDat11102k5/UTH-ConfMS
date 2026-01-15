import React from "react";
import { useTranslation } from "react-i18next";
import PortalHeader from "../../components/PortalHeader";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

const PublicAbout = () => {
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
                            <FiInfo size={40} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                            {t('public.about.heroTitle')}
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
                            {t('public.about.heroDesc')}
                        </p>
                    </div>
                </section>

                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem 4rem' }}>

                    {/* Mission */}
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                            {t('public.about.missionTitle')}
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            {t('public.about.missionText')}
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">
                            {t('public.about.contactTitle')}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                                    <FiMapPin size={24} />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">{t('public.about.addressTitle')}</h3>
                                <p className="text-slate-500 text-sm">
                                    {t('public.about.addressText')}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                                    <FiMail size={24} />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">{t('public.about.emailTitle')}</h3>
                                <p className="text-slate-500 text-sm">
                                    contact@uth.edu.vn<br />support@uth-confms.com
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
                                    <FiPhone size={24} />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2">{t('public.about.phoneTitle')}</h3>
                                <p className="text-slate-500 text-sm">
                                    (+84) 28 3512 6902<br />(+84) 28 3512 6903
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
};

export default PublicAbout;
