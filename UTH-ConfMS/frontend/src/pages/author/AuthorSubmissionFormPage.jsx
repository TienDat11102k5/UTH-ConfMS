// src/pages/author/AuthorSubmissionFormPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { getConferencesAPI } from "../../api/conferenceAPI";
import { submitPaperAPI } from "../../api/submissionAPI";
import { ToastContainer } from "../../components/Toast";

const AuthorSubmissionFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  const [conferences, setConferences] = useState([]);
  const [tracks, setTracks] = useState([]);
  
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    trackId: "",
    file: null,
    coAuthors: []
  });

  const [fileError, setFileError] = useState(null);
  const [coAuthorForm, setCoAuthorForm] = useState({
    name: "",
    email: "",
    affiliation: ""
  });

  useEffect(() => {
    loadConferences();
  }, []);

  const loadConferences = async () => {
    try {
      const data = await getConferencesAPI();
      setConferences(data);
    } catch (err) {
      console.error("Error loading conferences:", err);
      addToast(t('author.form.loadConferencesError'), "error");
    }
  };

  const handleConferenceChange = (e) => {
    const conferenceId = e.target.value;
    if (conferenceId) {
      const selectedConf = conferences.find(c => c.id.toString() === conferenceId);
      setTracks(selectedConf?.tracks || []);
    } else {
      setTracks([]);
    }
    setForm(prev => ({ ...prev, trackId: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setForm(prev => ({ ...prev, file: null }));
      return;
    }

    if (!file.type.includes('pdf')) {
      setFileError(t('author.form.pdfOnly'));
      e.target.value = null;
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError(t('author.form.fileTooLarge'));
      e.target.value = null;
      return;
    }

    if (file.size < 1024) {
      setFileError(t('author.form.fileTooSmall'));
      e.target.value = null;
      return;
    }

    setForm((prev) => ({ ...prev, file }));
  };

  const handleCoAuthorChange = (e) => {
    const { name, value } = e.target;
    setCoAuthorForm(prev => ({ ...prev, [name]: value }));
  };

  const addCoAuthor = () => {
    if (!coAuthorForm.name || !coAuthorForm.email) {
      addToast(t('author.form.coAuthorRequired'), "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coAuthorForm.email)) {
      addToast(t('validation.emailInvalid'), "error");
      return;
    }

    setForm(prev => ({
      ...prev,
      coAuthors: [...prev.coAuthors, { ...coAuthorForm }]
    }));

    setCoAuthorForm({ name: "", email: "", affiliation: "" });
  };

  const removeCoAuthor = (index) => {
    setForm(prev => ({
      ...prev,
      coAuthors: prev.coAuthors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.file) {
      addToast(t('author.form.fileRequired'), "error");
      return;
    }

    if (!form.trackId) {
      addToast(t('author.form.trackRequired'), "error");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('abstract', form.abstract);
      formData.append('trackId', form.trackId);
      formData.append('file', form.file);
      
      if (form.coAuthors.length > 0) {
        formData.append('coAuthors', JSON.stringify(form.coAuthors));
      }

      await submitPaperAPI(formData);
      
      addToast(t('author.form.submitSuccess'), "success");
      setTimeout(() => {
        navigate('/author/submissions');
      }, 2000);

    } catch (err) {
      console.error("Submission error:", err);
      addToast(err.response?.data?.message || err.message || t('author.form.submitError'), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      roleLabel="Author"
      title={t('author.form.title')}
      subtitle={t('author.form.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author" className="breadcrumb-link">
              {t('author.dashboard.title')}
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/author/submissions" className="breadcrumb-link">
              {t('common.submissions')}
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('author.form.newSubmission')}</span>
          </div>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="conferenceId">{t('common.conference')} *</label>
              <select
                id="conferenceId"
                name="conferenceId"
                value={form.conferenceId || ""}
                onChange={handleConferenceChange}
                required
                className="select-input"
                disabled={loading}
              >
                <option value="">-- {t('author.form.selectConference')} --</option>
                {conferences.map(conf => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trackId">{t('common.track')} *</label>
              <select
                id="trackId"
                name="trackId"
                value={form.trackId}
                onChange={handleChange}
                required
                className="select-input"
                disabled={loading || tracks.length === 0}
              >
                <option value="">-- {t('author.form.selectTrack')} --</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">{t('author.form.paperTitle')} *</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder={t('author.form.paperTitlePlaceholder')}
              value={form.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="abstract">{t('common.abstract')} *</label>
            <textarea
              id="abstract"
              name="abstract"
              rows={5}
              placeholder={t('author.form.abstractPlaceholder')}
              value={form.abstract}
              onChange={handleChange}
              required
              className="textarea-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>{t('author.form.coAuthors')}</label>
            
            {form.coAuthors.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                {form.coAuthors.map((author, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong>{author.name}</strong> - {author.email}
                      {author.affiliation && ` (${author.affiliation})`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoAuthor(index)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      disabled={loading}
                    >
                      {t('app.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label htmlFor="coAuthorName">{t('common.name')} *</label>
                  <input
                    id="coAuthorName"
                    name="name"
                    type="text"
                    placeholder={t('author.form.coAuthorNamePlaceholder')}
                    value={coAuthorForm.name}
                    onChange={handleCoAuthorChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="coAuthorEmail">{t('common.email')} *</label>
                  <input
                    id="coAuthorEmail"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={coAuthorForm.email}
                    onChange={handleCoAuthorChange}
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <label htmlFor="coAuthorAffiliation">{t('common.affiliation')}</label>
                <input
                  id="coAuthorAffiliation"
                  name="affiliation"
                  type="text"
                  placeholder={t('author.form.affiliationPlaceholder')}
                  value={coAuthorForm.affiliation}
                  onChange={handleCoAuthorChange}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={addCoAuthor}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                + {t('author.form.addCoAuthor')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="file">{t('author.form.pdfFile')} *</label>
            <input
              id="file"
              name="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
              disabled={loading}
            />
            <div className="field-hint">
              {t('author.form.fileHint')}
            </div>
            {fileError && (
              <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fileError}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/author/submissions" className="btn-secondary">
              {t('author.form.cancelAndBack')}
            </Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('app.loading') : t('author.form.submitPaper')}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default AuthorSubmissionFormPage;
