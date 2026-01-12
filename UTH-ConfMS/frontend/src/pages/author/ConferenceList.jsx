// src/pages/author/ConferenceList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/ConferenceList.css";

const ConferenceList = () => {
  const { t, i18n } = useTranslation();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await apiClient.get("/conferences", {
          skipAuth: true,
        });
        setConferences(response.data);
      } catch (err) {
        console.error(err);
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("currentUser");
          navigate("/login");
        } else {
          setError(t('author.conferenceList.loadError'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConferences();
  }, [navigate, t]);

  const formatDateCustom = (dateString, format = "full") => {
    if (!dateString) return t('author.conferenceList.comingSoon');
    
    const date = new Date(dateString);
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    if (format === "day") return vietnamDate.getDate();
    if (format === "my") {
      const monthLabel = i18n.language === 'vi' ? 'THÁNG' : 'MONTH';
      return `${monthLabel} ${vietnamDate.getMonth() + 1}, ${vietnamDate.getFullYear()}`;
    }
    return formatDate(dateString);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        {t('app.loading')}
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-white text-red-500">
        {error}
      </div>
    );

  const now = new Date();
  const sorted = [...conferences].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const upcoming = sorted.filter(c => new Date(c.startDate) >= now);
  const past = sorted.filter(c => new Date(c.startDate) < now).reverse();
  const displayConferences = [...upcoming, ...past];

  const chunkedConferences = [];
  for (let i = 0; i < displayConferences.length; i += 2) {
    chunkedConferences.push(displayConferences.slice(i, i + 2));
  }

  return (
    <div className="bg-white min-h-screen text-slate-900 overflow-x-hidden bg-noise">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bg-grid-pattern opacity-60 w-full h-full"></div>
      </div>

      <PortalHeader
        title="UTH Conference Portal · Author"
        subtitle="University of Transport HCMC"
      />

      <main className="relative z-10 font-body">
        <div className="hero-wrapper">
          <div className="bg-decor-left"></div>
          <div className="bg-decor-right"></div>
          <div className="bg-decor-horiz"></div>
          <div className="bg-blob-1"></div>
          <div className="bg-blob-2"></div>

          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-subtitle-top">
                <div className="dash-line"></div>
                <span className="hero-label">{t('author.conferenceList.academicConference')}</span>
              </div>

              <div className="hero-title-group">
                <h1 className="hero-bg-text">KNOWLEDGE</h1>
                <h1 className="hero-main-text">
                  {t('author.conferenceList.discover')} <br />
                  <span className="text-gradient">{t('author.conferenceList.knowledge')}</span>
                  <span className="hero-italic">{t('author.conferenceList.connectFuture')}</span>
                </h1>
              </div>

              <p className="hero-desc">
                {t('author.conferenceList.heroDesc')}
              </p>

              <div className="hero-actions">
                <Link to="/author/submissions/new" className="btn-submit">
                  <div className="btn-submit-bg"></div>
                  <span className="relative flex items-center gap-3">
                    {t('author.conferenceList.submitNow')}
                    <span className="material-symbols-outlined text-primary-accent">arrow_forward</span>
                  </span>
                </Link>
                <Link to="/program" className="btn-watch">
                  <div className="play-icon-circle">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </div>
                  <span>{t('author.conferenceList.viewProgram')}</span>
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex hero-visual justify-center items-center">
              <div className="nexus-graphic">
                <div className="nexus-ring-1 animate-spin-slow"></div>
                <div className="nexus-ring-2 animate-spin-reverse"></div>
                <div className="nexus-glow animate-pulse-glow"></div>
                <div className="nexus-center glass-morphism">
                  <span className="material-symbols-outlined text-6xl text-primary-accent">hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 relative z-20 pb-12">
          <div className="stats-marquee-row">
            <div className="stats-group">
              <div className="stat-block">
                <span className="stat-num">{conferences.length}<span className="text-primary-accent">+</span></span>
                <span className="stat-label">{t('common.conferences')}</span>
              </div>
              <div className="stat-block">
                <span className="stat-num">{conferences.reduce((acc, c) => acc + (c.submissionCount || 0), 0)}<span className="text-primary-accent">+</span></span>
                <span className="stat-label">{t('common.papers')}</span>
              </div>
            </div>

            <div className="marquee-container mask-image-gradient">
              <div className="marquee-content">
                {conferences.length > 0 ? (
                  [...conferences, ...conferences].map((conf, index) => (
                    <span key={index} className="marquee-item">
                      <span className={`text-${index % 2 === 0 ? 'primary-accent' : 'secondary'} mr-2`}>●</span>
                      {conf.name}: {new Date(conf.startDate) > new Date() ? t('author.conferenceList.openRegistration') : t('author.conferenceList.ended')}
                    </span>
                  ))
                ) : (
                  <span className="marquee-item">{t('author.conferenceList.updatingData')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="py-24 relative bg-[#f0fdfd]">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 relative z-10">
              <div>
                <h2 className="font-display font-bold text-5xl lg:text-7xl text-secondary mb-4">{t('author.conferenceList.events').toUpperCase()}</h2>
                <p className="font-serif italic text-2xl text-slate-500">{t('author.conferenceList.upcomingConferences')}</p>
              </div>
              <div className="hidden md:flex gap-2">
                {chunkedConferences.length > 1 && chunkedConferences.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-4 h-4 rounded-full transition-all duration-300 cursor-pointer hover:scale-110 ${currentPage === idx ? 'bg-primary-accent scale-125 shadow-lg' : 'bg-slate-300 hover:bg-primary-accent/50'}`}
                    aria-label={`${t('author.conferenceList.page')} ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {chunkedConferences.map((chunk, index) => {
                if (index !== currentPage) return null;

                const featuredConf = chunk[0];
                const upcomingConf = chunk.length > 1 ? chunk[1] : null;
                const baseIndex = index * 2;

                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[380px] animate-[fadeIn_0.5s_ease-out]">
                    <div className="lg:col-span-7 relative group cursor-pointer overflow-hidden rounded-sm border border-slate-200 hover:border-primary-accent/30 transition-colors duration-500 shadow-xl shadow-secondary/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-deep-ocean via-secondary to-primary-accent z-10"></div>
                      <div className="absolute inset-0 bg-secondary group-hover:scale-105 transition-transform duration-700">
                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-accent/40 via-secondary to-deep-ocean"></div>
                      </div>

                      <div className="relative z-20 p-8 h-full flex flex-col justify-between">
                        <div className="flex justify-between w-full">
                          <span className="inline-flex items-center justify-center px-3 py-1 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md leading-none pt-1.5 pb-1">{t('author.conferenceList.featured')}</span>
                          <span className="font-display font-bold text-4xl text-white/10 group-hover:text-white/30 transition-colors">
                            {baseIndex + 1 < 10 ? `0${baseIndex + 1}` : baseIndex + 1}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display font-bold text-3xl md:text-4xl text-white mb-4 leading-tight">
                            {featuredConf.name}
                          </h3>

                          <p className="text-slate-300 font-light max-w-lg mb-6 line-clamp-2">
                            {featuredConf.description || t('author.conferenceList.defaultDesc')}
                          </p>

                          <div className="flex items-center gap-6 text-sm font-mono text-slate-400 border-t border-white/10 pt-6 mt-2">
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">calendar_month</span>
                              {formatDateCustom(featuredConf.startDate, "full")}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">location_on</span>
                              {featuredConf.location || t('author.conferenceList.hallA')}
                            </span>
                            <Link
                              to={`/conferences/${featuredConf.id}`}
                              className="ml-auto text-white group-hover:translate-x-2 transition-transform"
                            >
                              {t('app.details')} →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 relative group cursor-pointer overflow-hidden rounded-sm bg-white border border-slate-200 hover:border-primary-accent/30 transition-colors shadow-lg">
                      {upcomingConf ? (
                        <div className="p-8 h-full flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="block text-primary-accent text-xs font-bold uppercase tracking-widest mb-2">{t('author.conferenceList.comingSoon')}</span>
                              <span className="font-display font-bold text-4xl text-slate-100 group-hover:text-slate-200 transition-colors">
                                {baseIndex + 2 < 10 ? `0${baseIndex + 2}` : baseIndex + 2}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-display font-bold text-3xl md:text-4xl text-secondary leading-tight mb-4">
                              {upcomingConf.name}
                            </h3>

                            <div className="space-y-4 mb-6">
                              {upcomingConf.chairs ? (
                                upcomingConf.chairs.split(',').slice(0, 1).map((chair, idx) => (
                                  <div key={idx} className="flex items-start gap-4">
                                    <img
                                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chair)}&background=random`}
                                      alt="Speaker"
                                      className="w-12 h-12 grayscale group-hover:grayscale-0 transition-all rounded object-cover"
                                    />
                                    <div>
                                      <p className="text-slate-900 font-bold text-sm">{chair.trim()}</p>
                                      <p className="text-slate-500 text-xs mt-1">{t('author.conferenceList.speaker')}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="prose prose-sm">
                                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-0">
                                    {upcomingConf.description || t('author.conferenceList.testDesc')}
                                  </p>
                                </div>
                              )}
                            </div>

                            <Link
                              to={`/conferences/${upcomingConf.id}`}
                              className="w-full py-3 border border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all block text-center"
                            >
                              {t('app.details').toUpperCase()}
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full bg-white rounded-sm p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 min-h-[480px]">
                          <span className="material-symbols-outlined text-5xl mb-3 opacity-20">event_busy</span>
                          <p className="italic text-sm">{t('author.conferenceList.endOfList')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-ocean font-body">
        <div className="footer-watermark">
          <h2 className="text-watermark">UTH PORTAL UTH PORTAL</h2>
        </div>
        <div className="footer-content">
          <div className="footer-grid">
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded border border-primary-accent flex items-center justify-center text-primary-accent">
                  <span className="material-symbols-outlined text-sm">hub</span>
                </div>
                <span className="font-display font-bold text-xl text-white tracking-widest">UTH CONF</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md font-light">
                {t('author.conferenceList.footerDesc')}
              </p>
              <div className="mt-8 flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-deep-ocean transition-colors">
                  <span className="material-symbols-outlined text-lg">public</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-deep-ocean transition-colors">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-mono font-bold text-primary-accent mb-6 text-xs uppercase tracking-widest">{t('author.conferenceList.navigation')}</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('author.conferenceList.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('author.conferenceList.reviewProcess')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('author.conferenceList.authorGuide')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono font-bold text-primary-accent mb-6 text-xs uppercase tracking-widest">{t('author.conferenceList.contact')}</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-base text-primary-accent">location_on</span>
                  70 Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, Thành phố Hồ Chí Minh
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-base text-primary-accent">alternate_email</span>
                  conference@ut.edu.vn
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-mono">© 2026 UNIVERSITY OF TRANSPORT HCMC.</p>
            <div className="flex gap-8 text-xs text-slate-500 font-mono">
              <a href="#" className="hover:text-primary-accent">{t('author.conferenceList.privacyPolicy')}</a>
              <a href="#" className="hover:text-primary-accent">{t('author.conferenceList.termsOfUse')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConferenceList;
