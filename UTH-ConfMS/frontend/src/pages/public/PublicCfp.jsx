import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import { formatDateTime } from "../../utils/dateUtils";
import "../../styles/PublicProceedings.css";
import {
  FiCalendar,
  FiFileText,
  FiUsers,
  FiAward,
  FiBook,
  FiClock,
  FiCheckCircle,
  FiSend
} from "react-icons/fi";
import "../../styles/PublicCfp.css";

const PublicCfp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const [loading, setLoading] = useState(true);
  const [conference, setConference] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConference = async () => {
      try {
        setLoading(true);
        // Fetch all conferences and pick the first one/most relevant one as the current featured CFP
        const response = await apiClient.get("/conferences", { skipAuth: true });
        if (response.data && response.data.length > 0) {
          // You might want to sort by date or find a specific one effectively
          // For now, we take the first one or one that is 'open'
          setConference(response.data[0]);
        } else {
          setError(t('errors.notFound'));
        }
      } catch (err) {
        console.error("Error fetching conference for CFP:", err);
        setError(t('app.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [t]);

  const handleSubmitPaper = () => {
    if (isLoggedIn) {
      if (conference) {
        navigate(`/author/submissions/new?confId=${conference.id}`);
      } else {
        navigate("/author/submissions/new");
      }
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">{t('app.loading')}</div>;
  }

  if (error || !conference) {
    return <div className="p-8 text-center text-red-500">{error || t('errors.notFound')}</div>;
  }


  // Calculate days remaining until deadline
  const deadlineDate = conference.submissionDeadline ? new Date(conference.submissionDeadline) : null;
  const today = new Date();

  let daysRemaining = 0;
  if (deadlineDate) {
    daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  }

  // Statistics data
  const stats = [
    { icon: FiFileText, label: t('public.cfpPage.topics'), value: conference.tracks ? `${conference.tracks.length}+` : "1+", color: "#0d9488" },
    { icon: FiUsers, label: t('public.cfpPage.expectedAuthors'), value: "100+", color: "#8b5cf6" }, // Expected authors is hard to guess from API without more data, kept as static estimation or could be derived if backend provides it
    { icon: FiClock, label: t('public.cfpPage.daysRemaining'), value: daysRemaining > 0 ? daysRemaining : t('public.cfpPage.closed'), color: "#f59e0b" }
  ];

  const topics = conference.tracks ? conference.tracks.map(t => t.name) : [];

  const timeline = [
    { date: formatDateTime(conference.submissionDeadline, false) || "TBA", event: t('public.cfpPage.submissionDeadline'), icon: FiSend },
    { date: formatDateTime(conference.reviewDeadline, false) || "TBA", event: t('public.cfpPage.resultNotification'), icon: FiCheckCircle },
    { date: formatDateTime(conference.startDate, false) || "TBA", event: t('public.cfpPage.conferenceDate'), icon: FiAward }
  ];

  return (
    <div className="public-cfp-page">
      {/* Modern Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <FiBook style={{ fontSize: '2.5rem', color: 'white' }} />
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              margin: 0
            }}>
              {conference.name || t('public.cfpPage.title')}
            </h1>
          </div>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '800px',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            {conference.description || t('public.cfpPage.heroDescription')}
          </p>
          <button
            onClick={handleSubmitPaper}
            style={{
              background: 'white',
              color: '#0d9488',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <FiSend /> {t('public.cfpPage.submitNow')}
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div style={{
        maxWidth: '1200px',
        margin: '-2rem auto 2rem',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.3s ease'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ fontSize: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <section className="cfp-content">
        {/* Topics Section */}
        {topics.length > 0 && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                padding: '0.75rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiBook style={{ fontSize: '1.25rem', color: 'white' }} />
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                {t('public.cfpPage.topicsTitle')}
              </h2>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {topics.map((topic, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'linear-gradient(to right, #f0fdfa, white)',
                  borderLeft: '3px solid #14b8a6',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ccfbf1, #f0fdfa)';
                    e.currentTarget.style.paddingLeft = '1.5rem';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #f0fdfa, white)';
                    e.currentTarget.style.paddingLeft = '1rem';
                  }}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiCalendar style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              {t('public.cfpPage.importantDates')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'linear-gradient(to right, #fffbeb, white)',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon style={{ fontSize: '1.25rem', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {item.event}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FiClock style={{ fontSize: '0.875rem' }} />
                      {item.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidelines Section */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              padding: '0.75rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiFileText style={{ fontSize: '1.25rem', color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              {t('public.cfpPage.guidelinesTitle')}
            </h2>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(to right, #f0fdfa, white)',
            borderRadius: '8px',
            lineHeight: '1.8',
            color: '#334155'
          }}>
            <p style={{ marginBottom: '1rem' }}>
              {t('public.cfpPage.guidelinesText1')}
            </p>
            <p style={{ margin: 0 }}>
              {t('public.cfpPage.guidelinesText2')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <button
            onClick={handleSubmitPaper}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <FiSend /> {t('public.cfpPage.submitPaper')}
          </button>
          <Link
            to="/conferences"
            style={{
              background: 'white',
              color: '#0d9488',
              border: '2px solid #0d9488',
              padding: '0.875rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f0fdfa';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FiUsers /> {t('public.cfpPage.viewConferenceList')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="proceedings-footer">
        <span>
          © {new Date().getFullYear()} {t('public.cfpPage.footer')}
        </span>
      </footer>
    </div>
  );
};

export default PublicCfp;
