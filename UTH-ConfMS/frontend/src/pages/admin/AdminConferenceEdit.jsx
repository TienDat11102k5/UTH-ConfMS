// src/pages/admin/AdminConferenceEdit.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import { ToastContainer } from "../../components/Toast";

const AdminConferenceEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => { const id = Date.now(); setToasts((prev) => [...prev, { id, message, type }]); }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  const [formData, setFormData] = useState({
    name: "", description: "", startDate: "", endDate: "", submissionDeadline: "", reviewDeadline: "", cameraReadyDeadline: "", blindReview: true, tracks: [],
  });

  const formatDateTimeForInput = (isoString) => { if (!isoString) return ""; return isoString.slice(0, 16); };

  useEffect(() => {
    const fetchConf = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/conferences/${id}`);
        const data = res.data;
        setFormData({
          name: data.name || "", description: data.description || "",
          startDate: formatDateTimeForInput(data.startDate), endDate: formatDateTimeForInput(data.endDate),
          submissionDeadline: formatDateTimeForInput(data.submissionDeadline), reviewDeadline: formatDateTimeForInput(data.reviewDeadline),
          cameraReadyDeadline: formatDateTimeForInput(data.cameraReadyDeadline), blindReview: data.blindReview !== undefined ? data.blindReview : true, 
          tracks: (data.tracks || []).map(track => {
            const timeParts = track.sessionTime ? track.sessionTime.split(' - ') : [];
            return {
              ...track,
              sessionStartTime: timeParts[0] || "",
              sessionEndTime: timeParts[1] || ""
            };
          }),
        });
      } catch (err) { console.error(err); setError(t('admin.conferenceEdit.loadError')); }
      finally { setLoading(false); }
    };
    fetchConf();
  }, [id, t]);

  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value })); };
  const handleTrackChange = (index, field, value) => { const newTracks = [...formData.tracks]; newTracks[index] = { ...newTracks[index], [field]: value }; setFormData({ ...formData, tracks: newTracks }); };
  const addTrack = () => { setFormData({ ...formData, tracks: [...formData.tracks, { name: "", description: "", sessionDate: "", sessionTime: "", room: "" }] }); };
  const removeTrack = (index) => { const newTracks = formData.tracks.filter((_, i) => i !== index); setFormData({ ...formData, tracks: newTracks }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(formData.startDate);
      const endDateTime = new Date(formData.endDate);
      if (endDateTime.getTime() <= startDateTime.getTime()) { setError(t('admin.conferenceEdit.endAfterStart')); return; }
    }

    if (formData.startDate && formData.endDate) {
      const confStartDate = new Date(formData.startDate); confStartDate.setHours(0, 0, 0, 0);
      const confEndDate = new Date(formData.endDate); confEndDate.setHours(23, 59, 59, 999);
      for (let i = 0; i < formData.tracks.length; i++) {
        const track = formData.tracks[i];
        if (track.sessionDate && track.sessionDate.trim() !== "") {
          const sessionDate = new Date(track.sessionDate + 'T00:00:00');
          if (!isNaN(sessionDate.getTime())) {
            if (sessionDate < confStartDate || sessionDate > confEndDate) { setError(t('admin.conferenceEdit.trackSessionError', { trackName: track.name })); return; }
          }
        }
      }
    }

    try {
      setSaving(true);
      const cleanTracks = formData.tracks.filter((t) => t.name && t.name.trim() !== "").map(track => ({
        ...track,
        sessionTime: track.sessionStartTime && track.sessionEndTime 
          ? `${track.sessionStartTime} - ${track.sessionEndTime}`
          : track.sessionTime || ""
      }));
      const convertToISO = (dateTimeLocal) => { if (!dateTimeLocal) return null; return dateTimeLocal + ':00'; };
      const payload = {
        ...formData,
        startDate: convertToISO(formData.startDate), endDate: convertToISO(formData.endDate),
        submissionDeadline: convertToISO(formData.submissionDeadline), reviewDeadline: convertToISO(formData.reviewDeadline),
        cameraReadyDeadline: convertToISO(formData.cameraReadyDeadline), tracks: cleanTracks,
      };
      await apiClient.put(`/conferences/${id}`, payload);
      addToast(t('admin.conferenceEdit.updateSuccess'), "success");
      setTimeout(() => navigate("/admin/conferences"), 800);
    } catch (err) { console.error(err); const msg = err.response?.data || t('admin.conferenceEdit.saveFailed'); setError(typeof msg === "string" ? msg : JSON.stringify(msg)); }
    finally { setSaving(false); }
  };

  if (loading) return (<AdminLayout title={t('app.loading')}><div className="form-card">{t('admin.conferenceEdit.loadingData')}</div></AdminLayout>);

  return (
    <AdminLayout title={`${t('admin.conferenceEdit.title')} #${id}`} subtitle={t('admin.conferenceEdit.subtitle')}>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/conferences" className="breadcrumb-link">{t('admin.conferences.title')}</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('app.edit')} #{id}</span>
          </div>
          <h2 className="data-page-title">{t('admin.conferenceEdit.updateInfo')}</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="submission-form" style={{ maxWidth: 960, margin: "0 auto" }}>
        {error && (<div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "1rem", color: "#991b1b", marginBottom: "1.5rem" }}>{error}</div>)}

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>{t('admin.conferenceCreate.generalInfo')}</h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.conferenceName')} *</label>
            <input name="name" value={formData.name} onChange={handleChange} required placeholder={t('admin.conferenceCreate.conferenceNamePlaceholder')} style={{ fontSize: "0.95rem" }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.description')} *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="textarea-input" style={{ fontSize: "0.95rem", lineHeight: "1.6" }} />
          </div>
          <label className="checkbox" style={{ fontSize: "0.95rem" }}>
            <input type="checkbox" name="blindReview" checked={formData.blindReview} onChange={handleChange} />
            <span style={{ marginLeft: "0.5rem" }}>{t('admin.conferenceCreate.blindReview')}</span>
          </label>
        </div>

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>{t('admin.conferenceCreate.eventSchedule')}</h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.startDate')} *</label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.endDate')} *</label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>{t('admin.conferenceCreate.endDateHint')}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.submissionDeadline')}</label>
            <input type="datetime-local" name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} />
            <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>{t('admin.conferenceCreate.submissionDeadlineHint')}</div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.reviewDeadline')}</label>
              <input type="datetime-local" name="reviewDeadline" value={formData.reviewDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>{t('admin.conferenceCreate.reviewDeadlineHint')}</div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>{t('admin.conferenceCreate.cameraReadyDeadline')}</label>
              <input type="datetime-local" name="cameraReadyDeadline" value={formData.cameraReadyDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>{t('admin.conferenceCreate.cameraReadyDeadlineHint')}</div>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>{t('admin.conferenceCreate.tracksSchedule')}</h3>
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", marginBottom: "1.5rem" }}>
          {formData.tracks.map((track, index) => (
            <div key={index} style={{ padding: "1.25rem", background: "#f9fafb", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ color: "#6b7280", minWidth: "32px", fontWeight: 600, fontSize: "0.9rem" }}>{index + 1}.</span>
                <input style={{ flex: 1, minWidth: 0, fontSize: "0.95rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} placeholder={t('admin.conferenceCreate.trackNamePlaceholder')} value={track.name || ""} onChange={(e) => handleTrackChange(index, 'name', e.target.value)} />
                <button type="button" className="btn-secondary table-action" style={{ color: "#dc2626", fontWeight: 500, padding: "0.5rem 1rem", borderRadius: "6px" }} onClick={() => removeTrack(index)}>{t('app.delete')}</button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginLeft: "40px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.conferenceCreate.sessionDate')}</label>
                  <input type="date" style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} value={track.sessionDate || ""} onChange={(e) => handleTrackChange(index, 'sessionDate', e.target.value)} />
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>{t('admin.conferenceCreate.sessionDateHint')}</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.conferenceCreate.sessionTime')}</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <input 
                        type="time" 
                        style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} 
                        value={track.sessionStartTime || ""} 
                        onChange={(e) => handleTrackChange(index, 'sessionStartTime', e.target.value)} 
                      />
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>Giờ bắt đầu</div>
                    </div>
                    <div>
                      <input 
                        type="time" 
                        style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} 
                        value={track.sessionEndTime || ""} 
                        onChange={(e) => handleTrackChange(index, 'sessionEndTime', e.target.value)} 
                      />
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>Giờ kết thúc</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.conferenceCreate.room')}</label>
                  <input style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} placeholder={t('admin.conferenceCreate.roomPlaceholder')} value={track.room || ""} onChange={(e) => handleTrackChange(index, 'room', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary table-action" onClick={addTrack} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", borderRadius: "6px" }}>+ {t('admin.conferenceCreate.addTrack')}</button>
        </div>

        <div className="form-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem", paddingTop: "1.5rem", borderTop: "2px solid #e5e7eb" }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ minWidth: "140px" }}>{saving ? t('app.loading') : t('admin.conferenceEdit.saveChanges')}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin/conferences")} style={{ minWidth: "120px" }}>{t('app.back')}</button>
        </div>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default AdminConferenceEdit;
