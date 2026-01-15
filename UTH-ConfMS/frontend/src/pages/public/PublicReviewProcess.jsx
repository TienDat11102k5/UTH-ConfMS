import React from "react";
import { useTranslation } from "react-i18next";
import PortalHeader from "../../components/PortalHeader";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiEdit3, FiEye, FiGitCommit, FiLayers, FiSend } from "react-icons/fi";

const PublicReviewProcess = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const steps = [
        {
            icon: FiSend,
            title: t('public.reviewProcess.step1Title'),
            desc: t('public.reviewProcess.step1Desc'),
            color: "#3b82f6"
        },
        {
            icon: FiEye,
            title: t('public.reviewProcess.step2Title'),
            desc: t('public.reviewProcess.step2Desc'),
            color: "#8b5cf6"
        },
        {
            icon: FiGitCommit,
            title: t('public.reviewProcess.step3Title'),
            desc: t('public.reviewProcess.step3Desc'),
            color: "#f59e0b"
        },
        {
            icon: FiCheckCircle,
            title: t('public.reviewProcess.step4Title'),
            desc: t('public.reviewProcess.step4Desc'),
            color: "#10b981"
        },
        {
            icon: FiLayers,
            title: t('public.reviewProcess.step5Title'),
            desc: t('public.reviewProcess.step5Desc'),
            color: "#ec4899"
        }
    ];

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
                            <FiEdit3 size={40} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                            {t('public.reviewProcess.heroTitle')}
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                            {t('public.reviewProcess.heroDesc')}
                        </p>
                    </div>
                </section>

                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem 5rem' }}>

                    <div className="space-y-8 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 hidden md:block"></div>

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="flex gap-6 relative">
                                    {/* Icon Bubble */}
                                    <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full items-center justify-center text-white z-10 shadow-md" style={{ backgroundColor: step.color }}>
                                        <Icon size={20} />
                                    </div>

                                    {/* Mobile Icon */}
                                    <div className="md:hidden flex-shrink-0 w-10 h-10 rounded-full items-center justify-center text-white mb-2" style={{ backgroundColor: step.color }}>
                                        <Icon size={18} />
                                    </div>

                                    <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex-1 hover:shadow-md transition-shadow">
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                                        <p className="text-slate-600 leading-relaxed text-sm">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicReviewProcess;
