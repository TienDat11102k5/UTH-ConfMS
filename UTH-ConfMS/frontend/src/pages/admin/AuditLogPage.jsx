// src/pages/admin/AuditLogPage.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import apiClient from "../../apiClient";

const AuditLogPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => { fetchLogs(); }, [currentPage, actorFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const apiPage = currentPage - 1;
      let url = `/audit-logs?page=${apiPage}&size=${itemsPerPage}`;
      if (actorFilter || actionFilter) {
        url = `/audit-logs/search?page=${apiPage}&size=${itemsPerPage}`;
        if (actorFilter) url += `&actor=${encodeURIComponent(actorFilter)}`;
        if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      }
      const res = await apiClient.get(url);
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalItems(res.data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError(t('admin.auditLog.loadError'));
    } finally { setLoading(false); }
  };

  const handleFilterChange = () => { setCurrentPage(1); fetchLogs(); };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const translateAction = (action) => {
    const translations = {
      'LOGIN_SUCCESS': t('admin.auditLog.actions.loginSuccess'),
      'LOGIN_FAILURE': t('admin.auditLog.actions.loginFailure'),
      'REGISTRATION': t('admin.auditLog.actions.registration'),
      'PASSWORD_CHANGE': t('admin.auditLog.actions.passwordChange'),
      'PASSWORD_RESET_REQUEST': t('admin.auditLog.actions.passwordResetRequest'),
      'PASSWORD_RESET_COMPLETE': t('admin.auditLog.actions.passwordResetComplete'),
      'ROLE_CHANGE': t('admin.auditLog.actions.roleChange'),
      'AUTHORIZATION_FAILURE': t('admin.auditLog.actions.authorizationFailure'),
      'CONFERENCE_CREATE': t('admin.auditLog.actions.conferenceCreate'),
      'CONFERENCE_DELETE': t('admin.auditLog.actions.conferenceDelete'),
      'PAPER_SUBMIT': t('admin.auditLog.actions.paperSubmit'),
      'REVIEW_SUBMIT': t('admin.auditLog.actions.reviewSubmit'),
      'DECISION': t('admin.auditLog.actions.decision')
    };
    return translations[action] || action;
  };

  return (
    <AdminLayout title={t('admin.auditLog.title')}>
      <div className="data-page-header"><div className="data-page-header-left"><div className="breadcrumb"></div></div></div>

      <div className="form-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: "1 1 300px", marginBottom: 0 }}>
            <label className="form-label">{t('admin.auditLog.searchActor')}</label>
            <input type="text" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} placeholder={t('admin.auditLog.enterEmail')} />
          </div>
          <div className="form-group" style={{ flex: "1 1 300px", marginBottom: 0 }}>
            <label className="form-label">{t('admin.auditLog.actionType')}</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">{t('common.all')}</option>
              <option value="LOGIN_SUCCESS">{t('admin.auditLog.actions.loginSuccess')}</option>
              <option value="LOGIN_FAILURE">{t('admin.auditLog.actions.loginFailure')}</option>
              <option value="REGISTRATION">{t('admin.auditLog.actions.registration')}</option>
              <option value="PASSWORD_CHANGE">{t('admin.auditLog.actions.passwordChange')}</option>
              <option value="ROLE_CHANGE">{t('admin.auditLog.actions.roleChange')}</option>
              <option value="CONFERENCE_CREATE">{t('admin.auditLog.actions.conferenceCreate')}</option>
              <option value="CONFERENCE_DELETE">{t('admin.auditLog.actions.conferenceDelete')}</option>
              <option value="PAPER_SUBMIT">{t('admin.auditLog.actions.paperSubmit')}</option>
              <option value="REVIEW_SUBMIT">{t('admin.auditLog.actions.reviewSubmit')}</option>
              <option value="DECISION">{t('admin.auditLog.actions.decision')}</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "stretch" }}>
            <button className="btn-primary" onClick={handleFilterChange} style={{ minWidth: "120px" }}>{t('admin.auditLog.filter')}</button>
            <button className="btn-secondary" onClick={() => { setActorFilter(""); setActionFilter(""); setCurrentPage(1); }} style={{ minWidth: "120px" }}>{t('admin.auditLog.clearFilter')}</button>
          </div>
        </div>
      </div>

      {error && (<div className="form-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", marginBottom: "1rem" }}>{error}</div>)}

      {loading ? (
        <div className="form-card">{t('app.loading')}</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>{t('admin.auditLog.actor')}</th>
                  <th>{t('admin.auditLog.action')}</th>
                  <th>{t('admin.auditLog.target')}</th>
                  <th>{t('admin.auditLog.ipAddress')}</th>
                  <th>{t('admin.auditLog.timestamp')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>{t('admin.auditLog.noData')}</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.actor}</td>
                      <td>
                        <span style={{ padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 500, background: log.action.includes("FAILURE") || log.action.includes("DELETE") ? "#fef2f2" : "#f0fdf4", color: log.action.includes("FAILURE") || log.action.includes("DELETE") ? "#991b1b" : "#166534" }}>
                          {translateAction(log.action)}
                        </span>
                      </td>
                      <td>{log.target || "-"}</td>
                      <td>{log.ipAddress || "-"}</td>
                      <td>{formatTimestamp(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} itemName={t('admin.auditLog.logs')} />
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AuditLogPage;
