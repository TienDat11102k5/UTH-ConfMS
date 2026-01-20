// src/pages/chair/ChairCOIManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import { FiAlertTriangle, FiSearch, FiEye } from "react-icons/fi";

const ChairCOIManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [conferenceMap, setConferenceMap] = useState({}); // Map trackId -> conference
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConference, setSelectedConference] = useState("");

  useEffect(() => {
    loadConferences();
    loadConflicts();
  }, []);

  const loadConferences = async () => {
    try {
      const res = await apiClient.get("/conferences");
      const confs = res.data || [];
      setConferences(confs);
      
      // Create a map of trackId -> conference for easy lookup
      const map = {};
      confs.forEach(conf => {
        if (conf.tracks) {
          conf.tracks.forEach(track => {
            map[track.id] = conf;
          });
        }
      });
      setConferenceMap(map);
    } catch (err) {
      console.error("Load conferences error:", err);
    }
  };

  const loadConflicts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/conflicts");
      setConflicts(res.data || []);
    } catch (err) {
      console.error("Load conflicts error:", err);
      setError(t('chair.coi.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Helper to get conference name from conflict
  const getConferenceName = (conflict) => {
    if (!conflict?.paper?.track?.id) return "N/A";
    const conf = conferenceMap[conflict.paper.track.id];
    return conf?.name || "N/A";
  };

  // Filter conflicts by search query and conference
  const filteredConflicts = conflicts.filter(conflict => {
    // Conference filter - check through track
    if (selectedConference) {
      const trackId = conflict.paper?.track?.id;
      const conf = conferenceMap[trackId];
      if (!conf || conf.id !== parseInt(selectedConference)) {
        return false;
      }
    }
    
    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const confName = getConferenceName(conflict).toLowerCase();
    return conflict.reviewer?.fullName?.toLowerCase().includes(query) ||
           conflict.reviewer?.email?.toLowerCase().includes(query) ||
           conflict.paper?.title?.toLowerCase().includes(query) ||
           conflict.paper?.track?.name?.toLowerCase().includes(query) ||
           confName.includes(query) ||
           conflict.reason?.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.coi.title')}>
        <TableSkeleton rows={8} columns={5} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.coi.title')}
      subtitle={t('chair.coi.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">
            <FiAlertTriangle style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "#f59e0b" }} />
            {t('chair.coi.pageTitle')}
          </h2>
          <p className="data-page-subtitle">
            {t('chair.coi.pageSubtitle')}
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

      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #f5c6cb",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          color: "#721c24"
        }}>
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div style={{
        marginBottom: "1.5rem",
        background: "white",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          {/* Search */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              {t('chair.coi.search')}
            </label>
            <div style={{ position: "relative" }}>
              <FiSearch style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                width: "16px",
                height: "16px"
              }} />
              <input
                type="text"
                placeholder={t('chair.coi.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.875rem 0.5rem 2.5rem",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "0.8125rem",
                  background: "white",
                  color: "#475569",
                }}
              />
            </div>
          </div>

          {/* Conference Filter */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              {t('chair.coi.filterByConference')}
            </label>
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.875rem",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.8125rem",
                background: "white",
                color: "#475569",
              }}
            >
              <option value="">{t('chair.coi.allConferences')}</option>
              {conferences.map(conf => (
                <option key={conf.id} value={conf.id}>{conf.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          borderRadius: "12px",
          padding: "1.25rem",
          color: "white"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            {t('chair.coi.totalConflicts')}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>
            {conflicts.length}
          </div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          borderRadius: "12px",
          padding: "1.25rem",
          color: "white"
        }}>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            {t('chair.coi.uniqueReviewers')}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>
            {new Set(conflicts.map(c => c.reviewer?.id)).size}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>{t('chair.coi.id')}</th>
              <th>{t('chair.coi.reviewer')}</th>
              <th>{t('chair.coi.paper')}</th>
              <th>{t('chair.coi.conference')}</th>
              <th>{t('chair.coi.reason')}</th>
              <th style={{ width: "120px" }}>{t('chair.coi.declaredDate')}</th>
              <th style={{ width: "120px", minWidth: "120px" }}>{t('chair.coi.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredConflicts.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  {searchQuery || selectedConference ? t('chair.coi.noResults') : t('chair.coi.noConflicts')}
                </td>
              </tr>
            ) : (
              filteredConflicts.map((conflict) => (
                <tr key={conflict.id}>
                  <td>{conflict.id}</td>
                  <td>
                    <div>
                      <strong>{conflict.reviewer?.fullName || "N/A"}</strong>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>
                        {conflict.reviewer?.email || ""}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: "250px" }}>
                      {conflict.paper?.title || "N/A"}
                      {conflict.paper?.track && (
                        <div style={{ fontSize: "0.85em", color: "#666", marginTop: "0.25rem" }}>
                          Track: {conflict.paper.track.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.9em" }}>
                      {getConferenceName(conflict)}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: "200px", fontSize: "0.9em" }}>
                      {conflict.reason || "—"}
                    </div>
                  </td>
                  <td>{formatDate(conflict.createdAt)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="btn-icon"
                      onClick={() => navigate(`/chair/coi/${conflict.id}`)}
                      title={t('chair.coi.viewDetail')}
                      style={{
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.875rem",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem"
                      }}
                    >
                      <FiEye size={14} />
                      {t('chair.coi.viewDetail')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(searchQuery || selectedConference) && filteredConflicts.length > 0 && (
        <div style={{
          marginTop: "1rem",
          fontSize: "0.875rem",
          color: "#64748b",
          textAlign: "center"
        }}>
          {t('chair.coi.showing')} {filteredConflicts.length} {t('chair.coi.of')} {conflicts.length} {t('chair.coi.conflicts')}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairCOIManagement;
