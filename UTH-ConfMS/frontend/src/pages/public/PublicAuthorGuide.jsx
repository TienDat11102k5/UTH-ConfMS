import React from "react";
import { useTranslation } from "react-i18next";
import PortalHeader from "../../components/PortalHeader";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiCheckSquare, FiDownload, FiFileText } from "react-icons/fi";

const PublicAuthorGuide = () => {
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
                            <FiBookOpen size={40} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                            {t('public.authorGuide.heroTitle')}
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                            {t('public.authorGuide.heroDesc')}
                        </p>
                    </div>
                </section>

                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem 5rem' }}>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Formatting */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-primary-600">
                                <FiFileText size={24} />
                                <h2 className="text-xl font-bold text-slate-800">{t('public.authorGuide.paperFormattingTitle')}</h2>
                            </div>
                            <ul className="space-y-3 text-slate-600 text-sm list-disc pl-5">
                                <li>{t('public.authorGuide.formattingList1')}</li>
                                <li>{t('public.authorGuide.formattingList2')}</li>
                                <li>{t('public.authorGuide.formattingList3')}</li>
                                <li>{t('public.authorGuide.formattingList4')}</li>
                                <li>{t('public.authorGuide.formattingList5')}</li>
                            </ul>
                            <div className="mt-6">
                                <button className="flex items-center gap-2 text-primary-600 font-bold text-sm hover:underline">
                                    <FiDownload /> {t('public.authorGuide.downloadTemplate')}
                                </button>
                            </div>
                        </div>

                        {/* Submission Checklist */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-green-600">
                                <FiCheckSquare size={24} />
                                <h2 className="text-xl font-bold text-slate-800">{t('public.authorGuide.checklistTitle')}</h2>
                            </div>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>{t('public.authorGuide.checklist1')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>{t('public.authorGuide.checklist2')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>{t('public.authorGuide.checklist3')}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>{t('public.authorGuide.checklist4')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Policies */}
                    <div className="mt-8 bg-slate-50 p-8 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('public.authorGuide.policyTitle')}</h2>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {t('public.authorGuide.policyText1')}
                        </p>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {t('public.authorGuide.policyText2')}
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default PublicAuthorGuide;
