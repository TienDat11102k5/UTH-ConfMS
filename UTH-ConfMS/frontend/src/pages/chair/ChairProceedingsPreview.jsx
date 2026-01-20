import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import { ListSkeleton } from "../../components/LoadingSkeleton";
import { FiDownload, FiEye, FiFilter } from "react-icons/fi";
import "../../styles/PublicProceedings.css";

const ChairProceedingsPreview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConferences();
  }, []);

  const fetchConferences = async () => {
    try {
      const res = await apiClient.get("/conferences");
      setConferences(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedConference(res.data[0].id);
        fetchProceedings(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching conferences:", err);
    }
  };

  const fetchProceedings = async (confId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/proceedings/${confId}`);
      setProceedings(res.data);
    } catch (err) {
      console.error("Error fetching proceedings:", err);
      alert(t('chair.proceedings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    setSelectedConference(confId);
    if (confId) {
      fetchProceedings(confId);
    } else {
      setProceedings([]);
    }
  };

  const handleExportJSON = async () => {
    if (!selectedConference) {
      alert(t('chair.proceedings.selectConferenceFirst'));
      return;
    }
    try {
      const res = await apiClient.get(`/proceedings/export/${selectedConference}`);
      const data = JSON.stringify(res.data, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proceedings-${selectedConference}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert(t('chair.proceedings.jsonExportSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('chair.proceedings.exportError'));
    }
  };

  const handleExportCSV = () => {
    if (!selectedConference || proceedings.length === 0) {
      alert(t('chair.proceedings.noDataToExport'));
      return;
    }

    try {
      const csvData = [];

      // Header
      csvData.push([
        "STT",
        "Tiêu đề",
        "Chủ đề",
        "Tác giả",
        "Tóm tắt"
      ]);

      // Data rows
      proceedings.forEach((paper, index) => {
        const allAuthors = paper.coAuthors
          ? `${paper.authorName}, ${paper.coAuthors}`
          : paper.authorName || t('chair.proceedings.noAuthorInfo');

        csvData.push([
          index + 1,
          `"${paper.title?.replace(/"/g, '""') || ''}"`,
          paper.trackName || "N/A",
          `"${allAuthors.replace(/"/g, '""')}"`,
          `"${paper.abstractText?.replace(/"/g, '""') || ''}"`,
        ]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(",")).join("\n");

      // Add BOM for UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `ky-yeu-${selectedConference}-${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(t('chair.proceedings.csvExportSuccess'));
    } catch (err) {
      console.error("Export error:", err);
      alert(t('chair.proceedings.csvExportError') + err.message);
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

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.proceedings.title')}>
        <ListSkeleton items={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.proceedings.title')}
      subtitle={t('chair.proceedings.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">{t('chair.proceedings.pageTitle')}</h2>
          <p className="data-page-subtitle">
            {t('chair.proceedings.pageSubtitle')}
          </p>
        </div>

        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate("/chair")}
          >
            {t('app.back')}
          </button>
        </div>
      </div>

      {/* Conference Selector & Actions */}
      <div style={{
        marginBottom: "1.5rem",
        background: "white",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: 1, minWidth: "250px" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#64748b",
            fontSize: "0.875rem",
          }}>
            {t('chair.proceedings.selectConference')}
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
            <option value="">{t('chair.proceedings.selectConferenceOption')}</option>
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "nowrap", marginLeft: "auto" }}>
          <button
            className="btn-primary"
            onClick={handleExportCSV}
            disabled={!selectedConference || proceedings.length === 0}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <FiDownload size={16} />
            {t('chair.proceedings.exportCSV')}
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportJSON}
            disabled={!selectedConference || proceedings.length === 0}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <FiDownload size={16} />
            {t('chair.proceedings.exportJSON')}
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.open(`/proceedings/${selectedConference}`, '_blank')}
            disabled={!selectedConference}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <FiEye size={16} />
            {t('chair.proceedings.viewPublic')}
          </button>
        </div>
      </div>

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
                {t('chair.proceedings.filterByTrack')}
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
                <option value="ALL">{t('chair.proceedings.allTracks')} ({proceedings.length})</option>
                {tracks.map((track) => (
                  <option key={track} value={track}>
                    {track} ({proceedings.filter(p => p.trackName === track).length})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                {t('chair.proceedings.search')}
              </label>
              <input
                type="text"
                placeholder={t('chair.proceedings.searchPlaceholder')}
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
          </div>
        </div>
      )}

      {/* Papers List */}
      {proceedings.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        }}>
          <EmptyState
            icon={selectedConference ? "file" : "search"}
            title={selectedConference ? t('chair.proceedings.noPapersTitle') : t('chair.proceedings.selectConferenceFirst')}
            description={selectedConference ? t('chair.proceedings.noPapersDescription') : t('chair.proceedings.selectConferenceDescription')}
            size="large"
          />
        </div>
      ) : (
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
            fontWeight: 600
          }}>
            {t('chair.proceedings.showing')} {filteredProceedings.length} / {proceedings.length} {t('chair.proceedings.papers')}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredProceedings.map((paper, index) => {
              const allAuthors = paper.coAuthors
                ? `${paper.authorName}, ${paper.coAuthors}`
                : paper.authorName || t('chair.proceedings.noAuthorInfo');

              return (
                <div key={paper.paperId || index} style={{
                  padding: "1.25rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#fafafa",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{
                      minWidth: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #008689, #00a8ac)",
                      color: "white",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1rem"
                    }}>
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: "1.0625rem",
                        fontWeight: 600,
                        color: "#008689",
                        marginBottom: "0.5rem",
                        lineHeight: 1.4
                      }}>
                        {paper.title}
                      </h3>

                      <div style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "0.5rem",
                        fontWeight: 500
                      }}>
                        {allAuthors}
                      </div>

                      {paper.abstractText && (
                        <p style={{
                          fontSize: "0.8125rem",
                          color: "#6b7280",
                          lineHeight: 1.6,
                          marginBottom: "0.75rem"
                        }}>
                          {paper.abstractText.length > 200
                            ? paper.abstractText.substring(0, 200) + "..."
                            : paper.abstractText}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <div>
                          {paper.trackName && (
                            <span style={{
                              padding: "0.25rem 0.75rem",
                              background: "#e0f2f1",
                              color: "#00695c",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}>
                              {paper.trackName}
                            </span>
                          )}
                        </div>

                        {paper.pdfUrl && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await apiClient.get(`/proceedings/download/${paper.paperId}`, {
                                  responseType: "blob",
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", `${paper.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error("Error downloading paper:", err);
                                alert("Không thể tải xuống file. Vui lòng thử lại sau.");
                              }
                            }}
                            style={{
                              padding: "0.375rem 0.875rem",
                              background: "#008689",
                              color: "white",
                              borderRadius: "6px",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.375rem",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "#006b6e"}
                            onMouseOut={(e) => e.currentTarget.style.background = "#008689"}
                          >
                            <FiDownload size={14} />
                            PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairProceedingsPreview;
