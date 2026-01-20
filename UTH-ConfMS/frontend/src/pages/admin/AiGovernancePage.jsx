// src/pages/admin/AiGovernancePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";
import { getFeatureFlags, enableFeature, disableFeature, getAuditLogs } from "../../api/ai/governanceAI";
import { useAuth } from "../../auth";
import { ToastContainer } from "../../components/Toast";
import "../../styles/AiGovernancePage.css";

const AiGovernancePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [conferences, setConferences] = useState([]);
  const [selectedConferenceId, setSelectedConferenceId] = useState(1);
  const userId = user?.id || user?.userId || null;

  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagsError, setFlagsError] = useState("");
  const [flags, setFlags] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");

  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, flag: null, isEnabling: false });

  const addToast = useCallback((message, type = "success") => { const id = Date.now(); setToasts((prev) => [...prev, { id, message, type }]); }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  // Get feature labels from translations
  const getFeatureLabel = (key) => ({ 
    name: t(`admin.aiGovernance.features.${key}.name`, key),
    description: t(`admin.aiGovernance.features.${key}.description`, `AI feature: ${key}`),
    role: t(`admin.aiGovernance.features.${key}.role`, t('admin.aiGovernance.system'))
  });

  useEffect(() => {
    const loadConferences = async () => {
      try { const res = await apiClient.get("/conferences"); const data = res.data || []; setConferences(data); if (data.length > 0) { setSelectedConferenceId(data[0].id); } }
      catch (err) { console.error("Load conferences error:", err); }
    };
    loadConferences();
  }, []);

  useEffect(() => {
    const fetchFlags = async () => {
      if (!selectedConferenceId) return;
      setLoadingFlags(true); setFlagsError("");
      try {
        const data = await getFeatureFlags(String(selectedConferenceId));
        const features = data.features || {};
        const featureKeys = ['grammar_check', 'polish_content', 'keyword_suggestion', 'paper_synopsis', 'reviewer_similarity', 'assignment_suggestion', 'decision_recommendation', 'review_summary', 'email_draft'];
        const mapped = featureKeys.map((key) => {
          const labels = getFeatureLabel(key);
          return { key, label: labels.name, description: labels.description, role: labels.role, enabled: features[key] === true };
        });
        setFlags(mapped);
      } catch (err) { console.error("Load flags error:", err); setFlagsError(err.message || t('admin.aiGovernance.loadError')); }
      finally { setLoadingFlags(false); }
    };
    fetchFlags();
  }, [selectedConferenceId, t]);

  // Auto-load logs when conference or feature filter changes
  useEffect(() => {
    if (!selectedConferenceId) return;
    const loadLogs = async () => {
      setLoadingLogs(true); setLogsError("");
      try { 
        const data = await getAuditLogs({ 
          conferenceId: String(selectedConferenceId), 
          feature: selectedFeature || undefined, 
          limit: 20, 
          offset: 0 
        }); 
        setLogs(data.logs || []); 
      }
      catch (err) { setLogsError(err.message || t('admin.aiGovernance.logsError')); }
      finally { setLoadingLogs(false); }
    };
    loadLogs();
  }, [selectedConferenceId, selectedFeature, t]);

  const handleToggleClick = (flag) => { setConfirmModal({ isOpen: true, flag: flag, isEnabling: !flag.enabled }); };
  const handleCloseModal = () => { setConfirmModal({ isOpen: false, flag: null, isEnabling: false }); };

  const handleConfirmToggle = async () => {
    const flag = confirmModal.flag;
    if (!flag) return;
    const featureName = flag.key;
    const featureLabel = flag.label;
    const isEnabling = confirmModal.isEnabling;
    handleCloseModal();

    setFlags((prev) => prev.map((f) => f.key === featureName ? { ...f, enabled: isEnabling } : f));

    try {
      const conferenceIdStr = String(selectedConferenceId);
      const userIdStr = userId ? String(userId) : null;
      if (isEnabling) { await enableFeature(conferenceIdStr, featureName, userIdStr); addToast(t('admin.aiGovernance.enableSuccess', { feature: featureLabel }), "success"); }
      else { await disableFeature(conferenceIdStr, featureName, userIdStr); addToast(t('admin.aiGovernance.disableSuccess', { feature: featureLabel }), "success"); }
    } catch (err) {
      console.error("Toggle flag error:", err);
      setFlags((prev) => prev.map((f) => f.key === featureName ? { ...f, enabled: flag.enabled } : f));
      addToast(err.message || t('admin.aiGovernance.toggleError'), "error");
    }
  };

  const handleLoadLogs = async () => {
    setLoadingLogs(true); setLogsError("");
    try { const data = await getAuditLogs({ conferenceId: String(selectedConferenceId), feature: selectedFeature || undefined, limit: 20, offset: 0 }); setLogs(data.logs || []); }
    catch (err) { setLogsError(err.message || t('admin.aiGovernance.logsError')); }
    finally { setLoadingLogs(false); }
  };

  const groupedFlags = flags.reduce((acc, flag) => { const role = flag.role; if (!acc[role]) acc[role] = []; acc[role].push(flag); return acc; }, {});

  return (
    <AdminLayout title={t('admin.aiGovernance.title')}>
      <div className="ai-governance-page">
        {flagsError && (<div className="alert alert-error">{flagsError}</div>)}

        {conferences.length > 0 && (
          <div className="governance-card">
            <div className="card-header"><h3>{t('admin.aiGovernance.selectConference')}</h3></div>
            <select value={selectedConferenceId} onChange={(e) => setSelectedConferenceId(parseInt(e.target.value))} className="conference-selector">
              {conferences.map((conf) => (<option key={conf.id} value={conf.id}>{conf.name}</option>))}
            </select>
          </div>
        )}

        <div className="governance-card">
          <div className="card-header"><h3>{t('admin.aiGovernance.featureConfig')}</h3></div>
          {loadingFlags ? (<div className="loading-state"><div className="spinner"></div><p>{t('admin.aiGovernance.loadingConfig')}</p></div>)
            : flags.length === 0 ? (<div className="empty-state"><p>{t('admin.aiGovernance.noFeatures')}</p></div>)
            : (
              <div className="features-grid">
                {Object.entries(groupedFlags).map(([role, roleFlags]) => (
                  <div key={role} className="role-section">
                    <h4 className="role-title">{role}</h4>
                    <div className="features-list">
                      {roleFlags.map((flag) => (
                        <div key={flag.key} className={`feature-card ${flag.enabled ? 'enabled' : 'disabled'}`}>
                          <div className="feature-info">
                            <div className="feature-name">{flag.label}</div>
                            <div className="feature-description">{flag.description}</div>
                          </div>
                          <div className="feature-actions">
                            <div className={`status-badge ${flag.enabled ? 'active' : 'inactive'}`}>{flag.enabled ? t('admin.aiGovernance.enabled') : t('admin.aiGovernance.disabled')}</div>
                            <button className={`toggle-btn ${flag.enabled ? 'btn-disable' : 'btn-enable'}`} type="button" onClick={() => handleToggleClick(flag)}>{flag.enabled ? t('admin.aiGovernance.turnOff') : t('admin.aiGovernance.turnOn')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="governance-card">
          <div className="card-header"><h3>{t('admin.aiGovernance.aiLogs')}</h3></div>
          <div className="logs-controls">
            <select value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)} className="feature-filter">
              <option value="">{t('admin.aiGovernance.allFeatures')}</option>
              {flags.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
            </select>
            <button className="btn-load-logs" type="button" onClick={handleLoadLogs} disabled={loadingLogs}>{loadingLogs ? t('app.loading') : t('admin.aiGovernance.loadLogs')}</button>
          </div>

          {logsError && (<div className="alert alert-error">{logsError}</div>)}

          {logs.length === 0 && !loadingLogs ? (<div className="empty-state"><p>{t('admin.aiGovernance.noLogs')}</p></div>)
            : (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>{t('admin.aiGovernance.timestamp')}</th>
                      <th>{t('admin.aiGovernance.feature')}</th>
                      <th>{t('admin.aiGovernance.action')}</th>
                      <th>{t('admin.aiGovernance.user')}</th>
                      <th>Model</th>
                      <th>{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => {
                      const timestamp = new Date(log.timestamp);
                      const formattedTime = timestamp.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                      const userName = log.user_name || log.user_email || `User #${log.user_id}`;
                      const featureLabels = getFeatureLabel(log.feature);
                      return (
                        <tr key={idx}>
                          <td className="log-time">{formattedTime}</td>
                          <td className="log-feature"><span className="feature-badge">{featureLabels.name}</span></td>
                          <td className="log-action">{log.action}</td>
                          <td className="log-user" title={log.user_email || ''}>{userName}</td>
                          <td className="log-model">{log.model_id}</td>
                          <td className="log-status">
                            {log.accepted === true && (<span className="status-badge accepted">✓ {t('admin.aiGovernance.accepted')}</span>)}
                            {log.accepted === false && (<span className="status-badge rejected">✗ {t('admin.aiGovernance.rejected')}</span>)}
                            {log.accepted === null && (<span className="status-badge pending">⋯ {t('admin.aiGovernance.pending')}</span>)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header"><h3>{t('admin.aiGovernance.confirm')}</h3></div>
            <div className="confirm-modal-body">
              <p>{t('admin.aiGovernance.confirmToggle', { action: confirmModal.isEnabling ? t('admin.aiGovernance.turnOn') : t('admin.aiGovernance.turnOff'), feature: confirmModal.flag?.label })}</p>
            </div>
            <div className="confirm-modal-footer">
              <button className="btn-cancel" type="button" onClick={handleCloseModal}>{t('app.cancel')}</button>
              <button className={`btn-confirm ${confirmModal.isEnabling ? 'btn-enable' : 'btn-disable'}`} type="button" onClick={handleConfirmToggle}>{t('admin.aiGovernance.agree')}</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default AiGovernancePage;
