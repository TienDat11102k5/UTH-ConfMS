import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { ToastContainer } from "../../components/Toast";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { FiDownload, FiFilter, FiSearch, FiGrid, FiList, FiBook, FiUsers, FiFolder, FiAward, FiCalendar, FiFileText } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const PublicProceedings = () => {
  const { t } = useTranslation();
  const { conferenceId } = useParams();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
      fetchProceedings(conferenceId);
    }
  }, [conferenceId]);

  const fetchConferences = async () => {
    try {
      const response = await apiClient.get("/conferences/all", { skipAuth: true });
      // Lấy tất cả hội nghị (kể cả bị ẩn) để có thể lọc theo hội nghị cụ thể
      const allConferences = response.data;
      
      // Hiển thị TẤT CẢ hội nghị trong dropdown (kể cả bị ẩn)
      setConferences(allConferences);

      if (conferenceId) {
        setSelectedConference(conferenceId);
        fetchProceedings(conferenceId);
      } else if (allConferences && allConferences.length > 0) {
        // Load proceedings từ TẤT CẢ hội nghị (kể cả bị ẩn) sử dụng endpoint /all
        setSelectedConference("");
        fetchAllProceedings();
      } else {
        setLoading(false);
        setError(t('public.proceedingsPage.noConferences'));
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
      setError(t('public.proceedingsPage.loadConferencesError'));
      setLoading(false);
    }
  };

  const fetchAllProceedings = async (confs) => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng endpoint /all để lấy tất cả bài ACCEPTED từ mọi hội nghị (kể cả bị ẩn)
      const response = await apiClient.get("/proceedings/all", {
        skipAuth: true,
      });
      
      setProceedings(response.data);
    } catch (err) {
      console.error("Error fetching all proceedings:", err);
      setError(t('public.proceedingsPage.loadProceedingsError'));
      setProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProceedings = async (confId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/proceedings/${confId}`, {
        skipAuth: true,
      });

      // Backend đã filter ACCEPTED rồi, không cần filter thêm
      setProceedings(response.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);

      if (err.response?.status === 404) {
        setError(t('public.proceedingsPage.conferenceNotFound'));
      } else {
        setError(t('public.proceedingsPage.loadProceedingsError'));
      }
      setProceedings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    setSearchQuery("");
    setSelectedTrack("ALL");
    setCurrentPage(1);
    if (confId) {
      fetchProceedings(confId);
    } else {
      // Load all proceedings using /all endpoint
      fetchAllProceedings();
    }
  };

  const handleDownload = async (paperId, title) => {
    try {
      const response = await apiClient.get(`/proceedings/download/${paperId}`, {
        responseType: "blob",
        skipAuth: true,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading paper:", err);
      addToast(t('public.proceedingsPage.downloadError'), "error");
    }
  };

  // Get unique tracks
  const tracks = [...new Set(proceedings.map(p => p.trackName).filter(Boolean))];

  // Filter proceedings
  const filteredProceedings = proceedings.filter(paper => {
    const matchTrack = selectedTrack === "ALL" || paper.trackName === selectedTrack;
    const allAuthors = paper.coAuthors
      ? `${paper.authorName} ${paper.coAuthors}`
      : paper.authorName || "";
    const matchSearch = !searchQuery.trim() ||
      paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      allAuthors.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrack && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProceedings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProceedings = filteredProceedings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTrack]);

  if (loading) {
    return (
      <div className="proceedings-page-modern">
        <PortalHeader
          title="UTH Conference Portal · Proceedings"
          ctaHref="/program"
          ctaText={t('public.proceedingsPage.viewProgram')}
        />

        <div style={{
          background: "linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(20, 184, 166, 0.08) 100%)",
          padding: "3rem 2rem",
          borderBottom: "3px solid #14b8a6",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%2314b8a6\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            opacity: 0.4
          }}></div>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1
          }}>
            <h1 style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              color: "#0d9488",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 4px rgba(13, 148, 136, 0.1)"
            }}>
              {t('public.proceedingsPage.title')}
            </h1>
            <p style={{
              fontSize: "1.0625rem",
              color: "#64748b",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.01em"
            }}>
              {t('public.proceedingsPage.subtitle')}
            </p>
          </div>
        </div>

        <div className="proceedings-container">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="proceedings-page-modern">
      {/* Header */}
      <PortalHeader
        title="UTH Conference Portal · Proceedings"
        ctaHref="/program"
        ctaText={t('public.proceedingsPage.viewProgram')}
      />

      {/* Hero Banner - Minimalist Clean Style */}
      <div className="minimalist-hero">
        {/* Subtle Background Gradient */}
        <div className="hero-gradient-overlay"></div>
        
        <div className="hero-content-minimal">
          {/* Breadcrumb Navigation */}
          <nav className="breadcrumb-nav">
            <Link to="/" className="breadcrumb-link">
              <span>{t('public.proceedingsPage.home')}</span>
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('public.proceedingsPage.proceedings')}</span>
          </nav>

          {/* Main Title - Left Aligned */}
          <div className="title-section">
            <div className="title-decoration-line"></div>
            <h1 className="minimal-title">
              {t('public.proceedingsPage.title')}
            </h1>
            <p className="minimal-subtitle">
              {t('public.proceedingsPage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="proceedings-container">
        {/* Statistics Summary - Yearbook Style */}
        {proceedings.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card stat-card-primary">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiFileText className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.proceedingsPage.totalPapers')}</div>
                <div className="stat-value">{proceedings.length}</div>
              </div>
              <div className="stat-decoration"></div>
            </div>

            <div className="stat-card stat-card-secondary">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiFolder className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.proceedingsPage.numTracks')}</div>
                <div className="stat-value">{tracks.length}</div>
              </div>
              <div className="stat-decoration"></div>
            </div>

            <div className="stat-card stat-card-accent">
              <div className="stat-card-bg"></div>
              <div className="stat-icon-wrapper">
                <FiUsers className="stat-icon" size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{t('public.proceedingsPage.authors')}</div>
                <div className="stat-value">
                  {new Set(proceedings.flatMap(p => {
                    const authors = [p.authorName];
                    if (p.coAuthors) {
                      authors.push(...p.coAuthors.split(',').map(a => a.trim()));
                    }
                    return authors.filter(Boolean);
                  })).size}
                </div>
              </div>
              <div className="stat-decoration"></div>
            </div>
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
              {t('public.proceedingsPage.selectConference')}:
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
              <option value="">{t('public.proceedingsPage.allConferences')}</option>
              {conferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Bar */}
        {proceedings.length > 0 && (
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}>
                  <FiFilter size={14} />
                  {t('public.proceedingsPage.filterByTrack')}:
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
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
                  <option value="ALL">{t('public.proceedingsPage.allTracks')} ({proceedings.length})</option>
                  {tracks.map((track) => (
                    <option key={track} value={track}>
                      {track} ({proceedings.filter(p => p.trackName === track).length})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#64748b",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}>
                  <FiSearch size={14} />
                  {t('public.proceedingsPage.search')}:
                </label>
                <input
                  type="text"
                  placeholder={t('public.proceedingsPage.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.8125rem",
                    background: "white",
                    color: "#475569",
                  }}
                />
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <div style={{ flex: "0 0 auto" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "#64748b",
                    fontSize: "0.875rem",
                  }}>{t('public.proceedingsPage.viewMode')}:</label>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => setViewMode("cards")}
                      style={{
                        padding: "0.5rem 0.875rem",
                        borderRadius: "8px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: viewMode === "cards" ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" : "white",
                        color: viewMode === "cards" ? "white" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <FiGrid size={16} />
                      {t('public.proceedingsPage.cardsView')}
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      style={{
                        padding: "0.5rem 0.875rem",
                        borderRadius: "8px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: viewMode === "table" ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" : "white",
                        color: viewMode === "table" ? "white" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <FiList size={16} />
                      {t('public.proceedingsPage.tableView')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

        {!error && proceedings.length === 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            color: "#6b7280",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
          }}>
            {t('public.proceedingsPage.noPapersPublished')}
          </div>
        )}

        {!error && proceedings.length > 0 && (
          <>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            }}>
              <div style={{
                marginBottom: "1rem",
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>{t('public.proceedingsPage.showing')} {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProceedings.length)} / {filteredProceedings.length} {t('public.proceedingsPage.papers')}</span>
              </div>

              {filteredProceedings.length === 0 ? (
                <div style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#6b7280",
                }}>
                  {t('public.proceedingsPage.noMatchingPapers')}
                </div>
              ) : (
                <>
                  {/* Card View - Yearbook Style */}
                  {viewMode === "cards" && (
                    <div className="yearbook-cards-grid">
                      {paginatedProceedings.map((paper, index) => {
                        const allAuthors = paper.coAuthors
                          ? `${paper.authorName}, ${paper.coAuthors}`
                          : paper.authorName || t('public.proceedingsPage.noAuthorInfo');
                        const globalIndex = startIndex + index + 1;

                        return (
                          <div key={paper.paperId || index} className="yearbook-paper-card">
                            {/* Decorative Corner */}
                            <div className="card-corner-decoration"></div>
                            
                            {/* Card Header with Number Badge */}
                            <div className="paper-card-header">
                              <div className="paper-number-badge">
                                <span className="badge-number">#{globalIndex}</span>
                              </div>
                              <div className="paper-track-badge">
                                <FiFolder size={14} />
                                <span>{paper.trackName || "N/A"}</span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="paper-card-body">
                              <h3 className="paper-card-title">
                                {paper.title}
                              </h3>

                              <div className="paper-authors-section">
                                <FiUsers size={16} className="authors-icon" />
                                <span className="authors-text">{allAuthors}</span>
                              </div>

                              {paper.abstractText && (
                                <p className="paper-abstract-text">
                                  {paper.abstractText}
                                </p>
                              )}
                            </div>

                            {/* Card Footer */}
                            <div className="paper-card-footer">
                              {paper.pdfUrl && paper.pdfUrl.trim() !== "" ? (
                                <button
                                  onClick={() => handleDownload(paper.paperId, paper.title)}
                                  className="download-btn-modern"
                                >
                                  <FiDownload size={18} />
                                  <span>{t('public.proceedingsPage.downloadPdf')}</span>
                                  <div className="btn-shine"></div>
                                </button>
                              ) : (
                                <div className="no-pdf-badge-modern">
                                  {t('public.proceedingsPage.pdfNotAvailable')}
                                </div>
                              )}
                            </div>

                            {/* Decorative Bottom Line */}
                            <div className="card-bottom-decoration"></div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Table View */}
                  {viewMode === "table" && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem"
                    }}>
                      <thead>
                        <tr style={{
                          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                          color: "white"
                        }}>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "50px",
                            whiteSpace: "nowrap"
                          }}>STT</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            minWidth: "300px"
                          }}>{t('public.proceedingsPage.tableTitle')}</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            minWidth: "200px"
                          }}>{t('public.proceedingsPage.tableAuthor')}</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "150px",
                            whiteSpace: "nowrap"
                          }}>{t('public.proceedingsPage.tableTrack')}</th>
                          <th style={{
                            padding: "0.875rem",
                            textAlign: "center",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            width: "100px",
                            whiteSpace: "nowrap"
                          }}>{t('public.proceedingsPage.tableDownload')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProceedings.map((paper, index) => {
                          const allAuthors = paper.coAuthors
                            ? `${paper.authorName}, ${paper.coAuthors}`
                            : paper.authorName || t('public.proceedingsPage.noAuthorInfo');
                          const globalIndex = startIndex + index + 1;

                          return (
                            <tr key={paper.paperId || index} style={{
                              borderBottom: "1px solid #e5e7eb",
                              transition: "background 0.2s ease"
                            }}
                              onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
                              onMouseOut={(e) => e.currentTarget.style.background = "white"}
                            >
                              <td style={{
                                padding: "1rem 0.875rem",
                                color: "#6b7280",
                                fontWeight: 600
                              }}>{globalIndex}</td>
                              <td style={{
                                padding: "1rem 0.875rem"
                              }}>
                                <div style={{
                                  fontWeight: 600,
                                  color: "#008689",
                                  lineHeight: 1.4
                                }}>
                                  {paper.title}
                                </div>
                              </td>
                              <td style={{
                                padding: "1rem 0.875rem",
                                color: "#374151",
                                lineHeight: 1.4
                              }}>{allAuthors}</td>
                              <td style={{
                                padding: "1rem 0.875rem"
                              }}>
                                <span style={{
                                  padding: "0.25rem 0.625rem",
                                  background: "#e0f2f1",
                                  color: "#00695c",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  display: "inline-block"
                                }}>
                                  {paper.trackName || "N/A"}
                                </span>
                              </td>
                              <td style={{
                                padding: "1rem 0.875rem",
                                textAlign: "center"
                              }}>
                                {paper.pdfUrl && paper.pdfUrl.trim() !== "" ? (
                                  <button
                                    onClick={() => handleDownload(paper.paperId, paper.title)}
                                    style={{
                                      padding: "0.375rem 0.75rem",
                                      background: "#008689",
                                      color: "white",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      border: "none",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.375rem",
                                      transition: "all 0.2s ease",
                                      whiteSpace: "nowrap"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = "#006b6e"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "#008689"}
                                  >
                                    <FiDownload size={14} />
                                    PDF
                                  </button>
                                ) : (
                                  <span style={{
                                    padding: "0.375rem 0.75rem",
                                    background: "#f3f4f6",
                                    color: "#9ca3af",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    display: "inline-block",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {t('public.proceedingsPage.notAvailable')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* Pagination - Shared by both views */}
                  {totalPages > 1 && (
                    <div style={{
                      marginTop: "1.5rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: "0.5rem 0.875rem",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          background: currentPage === 1 ? "#f3f4f6" : "white",
                          color: currentPage === 1 ? "#9ca3af" : "#374151",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {t('public.proceedingsPage.previous')}
                      </button>

                      <div style={{
                        display: "flex",
                        gap: "0.25rem"
                      }}>
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Show first, last, current, and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                  background: currentPage === page
                                    ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
                                    : "white",
                                  color: currentPage === page ? "white" : "#374151",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  minWidth: "36px",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return <span key={page} style={{ padding: "0.5rem 0.25rem", color: "#9ca3af" }}>...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "0.5rem 0.875rem",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          background: currentPage === totalPages ? "#f3f4f6" : "white",
                          color: currentPage === totalPages ? "#9ca3af" : "#374151",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {t('public.proceedingsPage.next')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="back-link-container">
          <Link to="/" className="back-link">
            ← {t('public.proceedingsPage.backToHome')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="proceedings-footer">
        <span>
          © {new Date().getFullYear()} {t('public.proceedingsPage.footer')}
        </span>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default PublicProceedings;
