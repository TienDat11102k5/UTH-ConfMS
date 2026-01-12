// src/pages/admin/BackupPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import apiClient from "../../apiClient";
import { ToastContainer } from "../../components/Toast";
import { FiDownload, FiRotateCcw, FiTrash2 } from 'react-icons/fi';

const BackupPage = () => {
  const { t } = useTranslation();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => { const id = Date.now(); setToasts((prev) => [...prev, { id, message, type }]); }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(backups, 20);

  useEffect(() => { fetchBackups(); }, []);

  const fetchBackups = async () => {
    try { setLoading(true); setError(""); const res = await apiClient.get("/backups"); setBackups(res.data || []); }
    catch (err) { console.error(err); setError(t('admin.backup.loadError')); }
    finally { setLoading(false); }
  };

  const handleCreateBackup = async () => {
    if (!confirm(t('admin.backup.confirmCreate'))) return;
    try { setCreating(true); await apiClient.post("/backups"); addToast(t('admin.backup.createSuccess'), "success"); fetchBackups(); }
    catch (err) { console.error(err); const errorMsg = err.response?.data?.error || t('admin.backup.createFailed'); addToast(errorMsg, "error"); }
    finally { setCreating(false); }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await apiClient.get(`/backups/download/${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); addToast(t('admin.backup.downloadFailed'), "error"); }
  };

  const handleRestore = async (filename) => {
    if (!confirm(t('admin.backup.confirmRestore', { filename }))) return;
    try { await apiClient.post(`/backups/restore/${filename}`); addToast(t('admin.backup.restoreSuccess'), "success"); setTimeout(() => { window.location.href = "/login"; }, 1500); }
    catch (err) { console.error(err); const errorMsg = err.response?.data?.error || t('admin.backup.restoreFailed'); addToast(errorMsg, "error"); }
  };

  const handleDelete = async (filename) => {
    if (!confirm(t('admin.backup.confirmDelete', { filename }))) return;
    try { await apiClient.delete(`/backups/${filename}`); addToast(t('admin.backup.deleteSuccess'), "success"); fetchBackups(); }
    catch (err) { console.error(err); const errorMsg = err.response?.data?.error || t('admin.backup.deleteFailed'); addToast(errorMsg, "error"); }
  };

  const formatDate = (timestamp) => { if (!timestamp) return ""; const date = new Date(timestamp); return date.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  const formatSize = (bytes) => { if (bytes < 1024) return bytes + " B"; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"; return (bytes / (1024 * 1024)).toFixed(2) + " MB"; };

  return (
    <AdminLayout title={t('admin.backup.title')}>
      <div className="data-page-header">
        <div className="data-page-header-left"><div className="breadcrumb"></div></div>
        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchBackups} disabled={loading}>{t('app.refresh')}</button>
          <button className="btn-primary" type="button" onClick={handleCreateBackup} disabled={creating}>{creating ? t('app.loading') : `+ ${t('admin.backup.createBackup')}`}</button>
        </div>
      </div>

      {error && (<div className="form-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", marginBottom: "1rem" }}>{error}</div>)}

      <div className="dash-grid">
        <div className="dash-card">
          <h3>{t('admin.backup.createBackup')}</h3>
          <p>{t('admin.backup.createDesc')}</p>
          <button className="btn-primary" type="button" onClick={handleCreateBackup} disabled={creating}>{creating ? t('app.loading') : t('admin.backup.backupNow')}</button>
        </div>
        <div className="dash-card">
          <h3>{t('admin.backup.note')}</h3>
          <p style={{ color: "#991b1b", fontWeight: 500 }}>⚠️ {t('admin.backup.restoreWarning')}</p>
          <p style={{ fontSize: "0.9em", color: "#6b7280", marginTop: "0.5rem" }}>{t('admin.backup.formatNote')}</p>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: "2rem" }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>{t('admin.backup.fileName')}</th>
              <th style={{ width: "120px" }}>{t('admin.backup.size')}</th>
              <th style={{ width: "180px" }}>{t('admin.backup.createdAt')}</th>
              <th style={{ width: "140px", textAlign: "center" }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={4} className="table-empty">{t('app.loading')}</td></tr>)
              : backups.length === 0 ? (<tr><td colSpan={4} className="table-empty">{t('admin.backup.noBackups')}</td></tr>)
              : (paginatedItems.map((b, index) => (
                <tr key={index}>
                  <td>{b.name}</td>
                  <td>{formatSize(b.size)}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                      <button type="button" title={t('admin.backup.download')} onClick={() => handleDownload(b.name)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#14b8a6" }}><FiDownload size={17} /></button>
                      <button type="button" title={t('admin.backup.restore')} onClick={() => handleRestore(b.name)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#3b82f6" }}><FiRotateCcw size={17} /></button>
                      <button type="button" title={t('app.delete')} onClick={() => handleDelete(b.name)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem", borderRadius: "4px", display: "inline-flex", alignItems: "center", color: "#ef4444" }}><FiTrash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>

      {!loading && backups.length > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} totalItems={backups.length} itemsPerPage={20} onPageChange={setCurrentPage} itemName={t('admin.backup.backups')} />)}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default BackupPage;
