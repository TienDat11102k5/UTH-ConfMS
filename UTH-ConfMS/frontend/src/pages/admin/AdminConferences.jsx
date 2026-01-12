// src/pages/admin/AdminConferences.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { ToastContainer } from "../../components/Toast";
import { FiEdit, FiEye, FiEyeOff, FiLock, FiUnlock, FiTrash2, FiFileText } from "react-icons/fi";

const AdminConferences = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(conferences, 20);

  const fetchConfs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t('admin.conferences.loadError'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchConfs(); }, []);

  const handleDelete = async (id) => {
    if (!confirm(t('admin.conferences.deleteWarning'))) return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
      addToast(t('admin.conferences.deleteSuccess'), "success");
    } catch (err) {
      console.error(err);
      addToast(t('admin.conferences.deleteFailed'), "error");
    }
  };

  const handleToggleHidden = async (id, currentStatus) => {
    const action = currentStatus ? t('admin.conferences.show') : t('admin.conferences.hide');
    if (!confirm(t('admin.conferences.confirmToggleHidden', { action }))) return;

    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-hidden`);
      setConferences((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      addToast(t('admin.conferences.toggleHiddenSuccess', { action }), "success");
    } catch (err) {
      console.error(err);
      addToast(t('admin.conferences.toggleHiddenFailed', { action }), "error");
    }
  };

  const handleToggleLocked = async (id, currentStatus) => {
    const action = currentStatus ? t('admin.conferences.unlock') : t('admin.conferences.lock');
    if (!confirm(t('admin.conferences.confirmToggleLocked', { action }))) return;

    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-locked`);
      setConferences((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      addToast(t('admin.conferences.toggleLockedSuccess', { action }), "success");
    } catch (err) {
      console.error(err);
      addToast(t('admin.conferences.toggleLockedFailed', { action }), "error");
    }
  };

  return (
    <AdminLayout title={t('admin.conferences.title')}>
      <div className="data-page-header">
        <div className="data-page-header-left"><div className="breadcrumb"></div></div>
        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchConfs}>{t('app.refresh')}</button>
          <button className="btn-primary" type="button" onClick={() => navigate("/admin/conferences/create")}>+ {t('admin.conferences.create')}</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>{t('admin.conferences.name')}</th>
              <th>{t('admin.conferences.eventDate')}</th>
              <th>{t('admin.conferences.submissionDeadline')}</th>
              <th>{t('admin.conferences.cameraReadyDeadline')}</th>
              <th style={{ width: "130px" }}>{t('common.status')}</th>
              <th style={{ width: "200px", textAlign: "center" }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="table-empty">{t('app.loading')}</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="table-empty" style={{ color: "#d72d2d" }}>{error}</td></tr>
            ) : conferences.length === 0 ? (
              <tr><td colSpan={7} className="table-empty">{t('admin.conferences.noConferences')}</td></tr>
            ) : (
              paginatedItems.map((c) => (
                <tr key={c.id} style={{ opacity: c.isHidden ? 0.6 : 1 }}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {c.tracks && c.tracks.length > 0 ? `${c.tracks.length} ${t('common.track')}` : t('admin.conferences.noTracks')}
                    </div>
                  </td>
                  <td>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "..."} - {c.endDate ? new Date(c.endDate).toLocaleDateString() : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">{new Date(c.submissionDeadline).toLocaleDateString()}</span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>{t('admin.conferences.notSet')}</span>
                    )}
                  </td>
                  <td>
                    {c.cameraReadyDeadline ? (
                      <span className="badge-soft" style={{ background: "#fef3c7", color: "#92400e" }}>{new Date(c.cameraReadyDeadline).toLocaleDateString()}</span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>{t('admin.conferences.notSet')}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                      {c.isHidden ? (<span className="badge-danger">{t('admin.conferences.hidden')}</span>) : (<span className="badge-success">{t('admin.conferences.visible')}</span>)}
                      {c.isLocked && (<FiLock size={16} color="#ef4444" title={t('admin.conferences.conferenceLockedTitle')} />)}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                      <button type="button" title={t('admin.conferences.viewSubmissions')} onClick={() => navigate(`/admin/conferences/${c.id}/submissions`)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#14b8a6" }}><FiFileText size={17} /></button>
                      <button type="button" title={t('app.edit')} onClick={() => navigate(`/admin/conferences/${c.id}/edit`)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}><FiEdit size={17} /></button>
                      <button type="button" title={c.isHidden ? t('admin.conferences.show') : t('admin.conferences.hide')} onClick={() => handleToggleHidden(c.id, c.isHidden)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#f59e0b" }}>{c.isHidden ? <FiEye size={17} /> : <FiEyeOff size={17} />}</button>
                      <button type="button" title={c.isLocked ? t('admin.conferences.unlock') : t('admin.conferences.lock')} onClick={() => handleToggleLocked(c.id, c.isLocked)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#8b5cf6" }}>{c.isLocked ? <FiUnlock size={17} /> : <FiLock size={17} />}</button>
                      <button type="button" title={t('app.delete')} onClick={() => handleDelete(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#ef4444" }}><FiTrash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && conferences.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={conferences.length} itemsPerPage={20} onPageChange={setCurrentPage} itemName={t('common.conference')} />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default AdminConferences;
