import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { FiCalendar, FiClock, FiMapPin, FiLayers, FiSearch } from "react-icons/fi";
import "../../styles/PublicProgram.css";
import "../../styles/PublicProceedings.css";

const PublicProgram = () => {
  const { t } = useTranslation();
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [program, setProgram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check if user is logged in
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

  useEffect(() => {
    fetchConferences();
  }, []);

  useEffect(() => {
    if (conferenceId) {
      setSelectedConference(conferenceId);
      fetchProgram(conferenceId);
    }
  }, [conferenceId]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences", { skipAuth: true });
      setConferences(response.data);

      if (!conferenceId && response.data && response.data.length > 0) {
        const firstConfId = response.data[0].id;
        setSelectedConference(firstConfId);
        fetchProgram(firstConfId);
      } else if (!conferenceId && (!response.data || response.data.length === 0)) {
        setLoading(false);
        setError(t('public.programPage.noConferences'));
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
      setError(t('public.programPage.loadConferencesError'));
      setLoading(false);
    }
  };

  const fetchProgram = async (confId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/proceedings/program/${confId}`, {
        skipAuth: true,
      });

      setProgram(response.data);
    } catch (err) {
      console.error("Error fetching program:", err);

      if (err.response?.status === 404) {
        setError(t('public.programPage.programNotFound'));
      } else {
        setError(t('public.programPage.loadProgramError'));
      }
      setProgram([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    if (confId) {
      fetchProgram(confId);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    // Nếu là format YYYY-MM-DD, chuyển sang DD/MM/YYYY
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <div className="program-page">
        <PortalHeader
          title="UTH Conference Portal · Program"
          ctaHref="/proceedings"
          ctaText={t('public.programPage.viewProceedings')}
        />

        {/* Minimalist Hero - Same as Proceedings */}
        <div className="minimalist-hero">
          <div className="hero-gradient-overlay"></div>
          
          <div className="hero-content-minimal">
            <nav className="breadcrumb-nav">
              <Link to="/" className="breadcrumb-link">
                <span>{t('public.programPage.home')}</span>
              </Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{t('public.programPage.program')}</span>
            </nav>

            <div className="title-section">
              <div className="title-decoration-line"></div>
              <h1 className="minimal-title">
                {t('public.programPage.title')}
              </h1>
              <p className="minimal-subtitle">
                {t('public.programPage.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="program-container">
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="program-page">
      {/* Header */}
      <PortalHeader
        title="UTH Conference Portal · Program"
        ctaHref="/proceedings"
        ctaText={t('public.programPage.viewProceedings')}
      />

      {/* Minimalist Hero - Same as Proceedings */}
      <div className="minimalist-hero">
        <div className="hero-gradient-overlay"></div>
        
        <div className="hero-content-minimal">
          <nav className="breadcrumb-nav">
            <Link to="/" className="breadcrumb-link">
              <span>{t('public.programPage.home')}</span>
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('public.programPage.program')}</span>
          </nav>

          <div className="title-section">
            <div className="title-decoration-line"></div>
            <h1 className="minimal-title">
              {t('public.programPage.title')}
            </h1>
            <p className="minimal-subtitle">
              {t('public.programPage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="program-container">
        {/* Statistics Summary - Yearbook Style */}
        {program.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card stat-card-primary">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiLayers className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.programPage.totalSessions')}</div>
                <div className="stat-value">{program.length}</div>
              </div>
              <div className="stat-decoration"></div>
            </div>

            <div className="stat-card stat-card-secondary">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiCalendar className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.programPage.totalPapers')}</div>
                <div className="stat-value">
                  {program.reduce((total, session) => total + session.papers.length, 0)}
                </div>
              </div>
              <div className="stat-decoration"></div>
            </div>

            <div className="stat-card stat-card-accent">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiMapPin className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.programPage.location')}</div>
                <div className="stat-value">
                  {[...new Set(program.map(s => s.room).filter(Boolean))].length || 0}
                </div>
              </div>
              <div className="stat-decoration"></div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {program.length > 0 && (
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <label style={{
              display: "flex",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
              alignItems: "center",
              gap: "0.375rem"
            }}>
              <FiSearch size={14} />
              {t('public.programPage.searchPapers')}:
            </label>
            <input
              type="text"
              placeholder={t('public.programPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.875rem",
                background: "white",
                color: "#475569",
              }}
            />
          </div>
        )}

        {/* Conference Selector */}
        {conferences.length > 1 && (
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              {t('public.programPage.selectConference')}:
            </label>
            <select
              value={selectedConference}
              onChange={handleConferenceChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                background: "white",
                color: "#475569",
              }}
            >
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#ef4444",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            {error}
          </div>
        )}

        {!error && program.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {program.filter(session => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return session.papers.some(paper => 
                paper.title?.toLowerCase().includes(query) ||
                paper.authorName?.toLowerCase().includes(query) ||
                paper.coAuthors?.toLowerCase().includes(query)
              );
            }).map((session, index) => {
              // Filter papers within session
              const filteredPapers = searchQuery.trim() 
                ? session.papers.filter(paper => {
                    const query = searchQuery.toLowerCase();
                    return paper.title?.toLowerCase().includes(query) ||
                      paper.authorName?.toLowerCase().includes(query) ||
                      paper.coAuthors?.toLowerCase().includes(query);
                  })
                : session.papers;

              return (
              <div key={index} style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                border: "1px solid #e5e7eb"
              }}>
                {/* Session Header */}
                <div style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  padding: "1.25rem 1.5rem",
                  color: "white"
                }}>
                  <h2 style={{
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    margin: "0 0 0.5rem 0",
                    letterSpacing: "-0.01em"
                  }}>
                    {session.trackName}
                  </h2>
                  {session.trackDescription && (
                    <p style={{
                      fontSize: "0.9375rem",
                      margin: "0 0 1rem 0",
                      opacity: 0.95,
                      lineHeight: 1.5
                    }}>
                      {session.trackDescription}
                    </p>
                  )}

                  {(session.sessionDate || session.sessionTime || session.room) && (
                    <div style={{
                      display: "flex",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      fontSize: "0.875rem",
                      fontWeight: 600
                    }}>
                      {session.sessionDate && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiCalendar size={16} />
                          {formatDisplayDate(session.sessionDate)}
                        </div>
                      )}
                      {session.sessionTime && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiClock size={16} />
                          {session.sessionTime}
                        </div>
                      )}
                      {session.room && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px"
                        }}>
                          <FiMapPin size={16} />
                          {session.room}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Papers List */}
                <div style={{ padding: "1.5rem" }}>
                  <div style={{
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    fontWeight: 600
                  }}>
                    {filteredPapers.length} {t('public.programPage.papers')}
                    {searchQuery.trim() && filteredPapers.length !== session.papers.length && (
                      <span style={{ color: "#0d9488", marginLeft: "0.5rem" }}>
                        ({t('public.programPage.filteredFrom')} {session.papers.length})
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredPapers.map((paper, paperIndex) => (
                      <div key={paper.paperId} style={{
                        padding: "1rem",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        gap: "1rem"
                      }}>
                        <div style={{
                          minWidth: "36px",
                          height: "36px",
                          background: "linear-gradient(135deg, #008689, #00a8ac)",
                          color: "white",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.9375rem"
                        }}>
                          {paperIndex + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#008689",
                            margin: "0 0 0.5rem 0",
                            lineHeight: 1.4
                          }}>
                            {paper.title}
                          </h3>
                          <div style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            lineHeight: 1.5
                          }}>
                            <span style={{ fontWeight: 600, color: "#475569" }}>{t('public.programPage.author')}:</span> {paper.authorName}
                            {paper.coAuthors && `, ${paper.coAuthors}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {!error && program.length === 0 && !loading && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#6b7280",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            {t('public.programPage.noProgramPublished')}
          </div>
        )}

        <div style={{
          marginTop: "2rem",
          textAlign: "center"
        }}>
          <Link to="/" style={{
            color: "#0d9488",
            textDecoration: "none",
            fontSize: "0.9375rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem 2rem",
            border: "2px solid #14b8a6",
            borderRadius: "12px",
            transition: "all 0.3s ease",
            background: "white"
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(13, 148, 136, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#0d9488";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ← {t('public.programPage.backToHome')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="proceedings-footer">
        <span>
          © {new Date().getFullYear()} {t('public.programPage.footer')}
        </span>
      </footer>
    </div>
  );
};

export default PublicProgram;
