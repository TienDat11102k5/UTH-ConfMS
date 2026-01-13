import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { usePagination } from '../../hooks/usePagination';
import { FiFileText, FiEdit, FiEye, FiEyeOff, FiTrash2, FiLock } from 'react-icons/fi';
import { ToastContainer } from "../../components/Toast";

const ChairConferenceManager = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(conferences, 20);

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchConfs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t('chair.conferences.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfs();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(t('chair.conferences.deleteWarning'))) return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data || t('chair.conferences.deleteFailed');
      addToast(errorMsg, "error");
    }
  };

  const handleToggleHidden = async (id, currentStatus) => {
    const action = currentStatus ? t('chair.conferences.show') : t('chair.conferences.hide');
    if (!confirm(t('chair.conferences.confirmHide', { action }))) return;

    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-hidden`);
      setConferences((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
      addToast(t('chair.conferences.hideSuccess', { action }), "success");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data || t('chair.conferences.hideFailed', { action });
      addToast(errorMsg, "error");
    }
  };

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.conferences.title')}
      subtitle={t('chair.conferences.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">{t('common.conferences')}</span>
          </div>
          <h2 className="data-page-title">{t('chair.conferences.conferenceList')}</h2>
        </div>

        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchConfs}>
            {t('app.refresh')}
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate("/chair/conferences/create")}
          >
            + {t('chair.conferences.createConference')}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>{t('chair.conferences.conferenceName')}</th>
              <th>{t('chair.conferences.eventDate')}</th>
              <th>{t('chair.conferences.submissionDeadline')}</th>
              <th>{t('chair.conferences.cameraReadyDeadline')}</th>
              <th style={{ width: "100px" }}>{t('common.status')}</th>
              <th style={{ width: "220px", textAlign: "center" }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  {t('app.loading')}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="table-empty" style={{ color: "#d72d2d" }}>
                  {error}
                </td>
              </tr>
            ) : conferences.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                  <EmptyState
                    icon="inbox"
                    title={t('chair.conferences.noConferences')}
                    description={t('chair.conferences.noConferencesDesc')}
                    size="medium"
                  />
                </td>
              </tr>
            ) : (
              paginatedItems.map((c) => (
                <tr key={c.id} style={{ opacity: c.isHidden ? 0.6 : 1 }}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {c.tracks && c.tracks.length > 0
                        ? `${c.tracks.length} track${c.tracks.length > 1 ? "s" : ""}`
                        : t('chair.conferences.noTrack')}
                    </div>
                  </td>
                  <td>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "..."} -{" "}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>{t('chair.conferences.notSet')}</span>
                    )}
                  </td>
                  <td>
                    {c.cameraReadyDeadline ? (
                      <span className="badge-soft" style={{ background: "#fef3c7", color: "#92400e" }}>
                        {new Date(c.cameraReadyDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>{t('chair.conferences.notSet')}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                      {c.isHidden ? (
                        <span className="badge-danger">{t('chair.conferences.hidden')}</span>
                      ) : (
                        <span className="badge-success">{t('chair.conferences.visible')}</span>
                      )}
                      {c.isLocked && (
                        <FiLock size={16} color="#ef4444" title={t('chair.conferences.locked')} />
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                      <button
                        type="button"
                        title={t('chair.conferences.viewSubmissions')}
                        onClick={() => navigate(`/chair/conferences/${c.id}/submissions`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#14b8a6",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0fdfa";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiFileText size={17} />
                      </button>

                      <button
                        type="button"
                        title={c.isLocked ? t('chair.conferences.locked') : t('app.edit')}
                        onClick={() => navigate(`/chair/conferences/${c.id}/edit`)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#3b82f6",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiEdit size={17} />
                      </button>

                      <button
                        type="button"
                        title={c.isLocked ? t('chair.conferences.locked') : (c.isHidden ? t('chair.conferences.show') : t('chair.conferences.hide'))}
                        onClick={() => handleToggleHidden(c.id, c.isHidden)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: c.isHidden ? "#059669" : "#f59e0b",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = c.isHidden ? "#ecfdf5" : "#fffbeb";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {c.isHidden ? <FiEye size={17} /> : <FiEyeOff size={17} />}
                      </button>

                      <button
                        type="button"
                        title={c.isLocked ? t('chair.conferences.locked') : t('app.delete')}
                        onClick={() => handleDelete(c.id)}
                        disabled={c.isLocked}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: c.isLocked ? "not-allowed" : "pointer",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#ef4444",
                          opacity: c.isLocked ? 0.4 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!c.isLocked) {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && conferences.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={conferences.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName={t('common.conferences')}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ChairConferenceManager;
