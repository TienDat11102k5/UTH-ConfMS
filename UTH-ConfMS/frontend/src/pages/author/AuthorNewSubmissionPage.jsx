// src/pages/author/AuthorNewSubmissionPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { ToastContainer } from "../../components/Toast";
import { formatDateTime } from "../../utils/dateUtils";

const AIModal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", padding: "24px", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>{title}</h3>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "#f3f4f6", border: "none", fontSize: "1.5rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const AuthorNewSubmissionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confId = searchParams.get("confId");

  const [conference, setConference] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingConf, setLoadingConf] = useState(false);
  const [confError, setConfError] = useState("");
  const [conferences, setConferences] = useState([]);
  const [loadingConfs, setLoadingConfs] = useState(false);
  const [confListError, setConfListError] = useState("");

  const [formValues, setFormValues] = useState({ title: "", abstractText: "", keywords: "", trackId: "" });
  const [file, setFile] = useState(null);
  const [coAuthors, setCoAuthors] = useState([{ name: "", email: "", affiliation: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  const [aiLoading, setAiLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);
  const [polishResult, setPolishResult] = useState(null);
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);

  useEffect(() => {
    let ignore = false;
    const loadConferences = async () => {
      try {
        setLoadingConfs(true);
        setConfListError("");
        const res = await apiClient.get("/conferences", { skipAuth: true });
        if (ignore) return;
        setConferences(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (ignore) return;
        if (err?.response?.status === 401 || err?.response?.status === 403) { navigate("/login"); return; }
        setConfListError(t('author.newSubmission.loadConferencesError'));
      } finally { if (!ignore) setLoadingConfs(false); }
    };
    loadConferences();
    return () => { ignore = true; };
  }, [navigate, t]);

  useEffect(() => {
    if (!confId) return;
    let ignore = false;
    const loadConference = async () => {
      setLoadingConf(true);
      setConfError("");
      try {
        const res = await apiClient.get(`/conferences/${confId}`, { skipAuth: true });
        if (ignore) return;
        setConference(res.data);
        const fetchedTracks = res.data?.tracks || [];
        setTracks(fetchedTracks);
        if (fetchedTracks.length) {
          setFormValues((prev) => ({ ...prev, trackId: prev.trackId || (fetchedTracks[0].id ? String(fetchedTracks[0].id) : "") }));
        }
      } catch (err) { if (!ignore) setConfError(t('author.newSubmission.loadConferenceError')); }
      finally { if (!ignore) setLoadingConf(false); }
    };
    loadConference();
    return () => { ignore = true; };
  }, [confId, t]);

  const handleChange = (e) => { const { name, value } = e.target; setFormValues((prev) => ({ ...prev, [name]: value })); };
  const handleFileChange = (e) => { const uploaded = e.target.files?.[0]; setFile(uploaded || null); };
  const handleCoAuthorChange = (index, field, value) => { setCoAuthors((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))); };
  const addCoAuthor = () => { setCoAuthors((prev) => [...prev, { name: "", email: "", affiliation: "" }]); };
  const removeCoAuthor = (index) => { setCoAuthors((prev) => prev.filter((_, i) => i !== index)); };

  const handleCheckGrammar = async (field) => {
    const text = field === "Title" ? formValues.title : formValues.abstractText;
    const fieldVN = field === "Title" ? t('author.form.paperTitle') : t('common.abstract');
    if (!text || text.trim().length < 5) { addToast(t('author.newSubmission.enterFieldFirst', { field: fieldVN }), "warning"); return; }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/grammar-check", { text, fieldName: field, conferenceId: confId ? parseInt(confId) : null });
      setGrammarResult({ ...res.data, field: fieldVN });
    } catch (err) { addToast(t('author.newSubmission.grammarError') + ": " + (err.response?.data?.message || err.message), "error"); }
    finally { setAiLoading(false); }
  };

  const handlePolish = async () => {
    const text = formValues.abstractText;
    if (!text || text.trim().length < 10) { addToast(t('author.newSubmission.enterAbstractFirst'), "warning"); return; }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/polish", { content: text, type: "abstract", conferenceId: confId ? parseInt(confId) : null });
      setPolishResult(res.data);
    } catch (err) { addToast(t('author.newSubmission.polishError') + ": " + (err.response?.data?.message || err.message), "error"); }
    finally { setAiLoading(false); }
  };

  const handleSuggestKeywords = async () => {
    if (!formValues.title || !formValues.abstractText) { addToast(t('author.newSubmission.enterTitleAbstractFirst'), "warning"); return; }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/suggest-keywords", { title: formValues.title, abstractText: formValues.abstractText, maxKeywords: 5, conferenceId: confId ? parseInt(confId) : null });
      setKeywordSuggestions(res.data.keywords || []);
    } catch (err) { addToast(t('author.newSubmission.keywordError'), "error"); }
    finally { setAiLoading(false); }
  };

  const applyCorrection = (correctedText, field) => {
    if (field === t('author.form.paperTitle')) setFormValues((prev) => ({ ...prev, title: correctedText }));
    else setFormValues((prev) => ({ ...prev, abstractText: correctedText }));
    setGrammarResult(null);
  };

  const applyPolish = (polishedText) => { setFormValues((prev) => ({ ...prev, abstractText: polishedText })); setPolishResult(null); };

  const addKeyword = (kw) => {
    setFormValues((prev) => {
      const current = prev.keywords ? prev.keywords.split(";").map(k => k.trim()).filter(Boolean) : [];
      if (!current.includes(kw)) return { ...prev, keywords: [...current, kw].join("; ") };
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    const payloadTrackId = formValues.trackId || (tracks[0]?.id ? String(tracks[0].id) : "");
    if (!payloadTrackId) { setError(t('author.form.trackRequired')); return; }
    if (!file) { setError(t('author.form.fileRequired')); return; }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("abstract", formValues.abstractText);
      formData.append("trackId", payloadTrackId);
      if (formValues.keywords) formData.append("keywords", formValues.keywords);
      if (coAuthors?.length) {
        const filled = coAuthors.filter((c) => c.name?.trim() || c.email?.trim() || c.affiliation?.trim());
        if (filled.length) formData.append("coAuthors", JSON.stringify(filled));
      }
      formData.append("file", file);
      await apiClient.post("/submissions", formData);
      setSuccessMessage(t('author.form.submitSuccess'));
      setTimeout(() => { navigate("/author/submissions"); }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || t('author.newSubmission.submitError');
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="dash-page">
      <PortalHeader title="UTH Conference Portal · Author" ctaHref="/author/dashboard" ctaText={t('author.dashboard.title')} />
      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">{t('app.portal')}</Link>
                <span className="breadcrumb-separator">/</span>
                <Link to="/author/submissions" className="breadcrumb-link">{t('author.submissions.title')}</Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{t('author.form.newSubmission')}</span>
              </div>
              <h1 className="data-page-title">{t('author.form.newSubmission')}</h1>
              <p className="data-page-subtitle">{t('author.newSubmission.pageSubtitle')}</p>
            </div>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {successMessage && <div className="auth-success" style={{ marginBottom: "1rem" }}>{successMessage}</div>}

          <div className="form-card" style={{ marginTop: "1rem" }}>
            <div style={{ marginBottom: "1rem", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
              <label><b>{t('author.newSubmission.selectConference')}: </b></label>
              <select
                className="select-input"
                style={{ maxWidth: "300px", marginLeft: "10px" }}
                value={confId || ""}
                onChange={(e) => e.target.value ? navigate(`/author/submissions/new?confId=${e.target.value}`) : navigate("/author/submissions/new")}
              >
                <option value="">-- {t('author.form.selectConference')} --</option>
                {conferences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <form className="submission-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="title">{t('author.form.paperTitle')} <span style={{ color: "red" }}>*</span></label>
                      <button type="button" onClick={() => handleCheckGrammar("Title")} disabled={aiLoading}
                        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1rem" }}>✨</span>{t('author.newSubmission.checkErrors')}
                      </button>
                    </div>
                    <input id="title" name="title" type="text" className="text-input" required value={formValues.title} onChange={handleChange} placeholder={t('author.form.paperTitlePlaceholder')} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="abstractText">{t('common.abstract')} <span style={{ color: "red" }}>*</span></label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => handleCheckGrammar("Abstract")} disabled={aiLoading}
                          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "1rem" }}>✨</span>{t('author.newSubmission.checkErrors')}
                        </button>
                        <button type="button" onClick={handlePolish} disabled={aiLoading}
                          style={{ background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", color: "#1e293b", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "1rem" }}>✨</span>{t('author.newSubmission.polishStyle')}
                        </button>
                      </div>
                    </div>
                    <textarea id="abstractText" name="abstractText" className="textarea-input" required value={formValues.abstractText} onChange={handleChange} style={{ minHeight: "150px" }} placeholder={t('author.newSubmission.abstractPlaceholder')} />
                    <div className="field-hint">{t('author.newSubmission.abstractHint')}</div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="keywords">{t('common.keywords')} </label>
                      <button type="button" onClick={handleSuggestKeywords} disabled={aiLoading}
                        style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1rem" }}>✨</span>{t('author.newSubmission.suggestKeywords')}
                      </button>
                    </div>
                    <input id="keywords" name="keywords" type="text" className="text-input" value={formValues.keywords} onChange={handleChange} placeholder={t('author.newSubmission.keywordsPlaceholder')} />
                    <div className="field-hint">{t('author.newSubmission.keywordsHint')}</div>
                    {keywordSuggestions.length > 0 && (
                      <div style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                        <b>{t('author.newSubmission.suggestions')}: </b>
                        {keywordSuggestions.map((kw, idx) => (
                          <span key={idx} onClick={() => addKeyword(kw)} style={{ cursor: "pointer", background: "#eef2ff", color: "#4f46e5", padding: "2px 6px", borderRadius: "4px", marginRight: "5px", display: "inline-block", marginTop: "2px" }}>+ {kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="form-group">
                    <label htmlFor="trackId">{t('common.track')} <span style={{ color: "red" }}>*</span></label>
                    <select id="trackId" name="trackId" className="text-input" required value={formValues.trackId} onChange={handleChange} disabled={!conference || tracks.length === 0}>
                      <option value="">-- {t('author.form.selectTrack')} --</option>
                      {tracks.map((track) => (<option key={track.id} value={track.id}>{track.name}</option>))}
                    </select>
                    <div className="field-hint">
                      {!conference ? t('author.newSubmission.selectConferenceFirst') : tracks.length === 0 ? t('author.newSubmission.noTracks') : t('author.newSubmission.selectTrackHint')}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="file">{t('author.newSubmission.paperFile')} <span style={{ color: "red" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input id="file" name="file" type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                      <label htmlFor="file" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "0.875rem 1rem", borderRadius: "8px", border: "2px solid #e2e8f0", background: "transparent", fontSize: "0.95rem", cursor: "pointer" }}>
                        <span style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "6px 16px", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap" }}>{t('author.newSubmission.chooseFile')}</span>
                        <span style={{ color: file ? "#059669" : "#64748b", fontWeight: file ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file ? file.name : t('author.newSubmission.noFileSelected')}
                        </span>
                      </label>
                    </div>
                    <div className="field-hint">{t('author.newSubmission.fileHint')}</div>
                  </div>

                  <div className="form-group">
                    <label>{t('author.newSubmission.coAuthorsOptional')}</label>
                    <button type="button" className="btn-secondary" onClick={addCoAuthor} style={{ marginLeft: "10px", padding: "2px 6px", fontSize: "0.8rem" }}>+ {t('app.add')}</button>
                    {coAuthors.map((c, idx) => (
                      <div key={idx} style={{ marginTop: "10px", padding: "10px", border: "1px dashed #ccc", borderRadius: "5px" }}>
                        <input type="text" placeholder={t('common.name')} value={c.name} onChange={(e) => handleCoAuthorChange(idx, "name", e.target.value)} style={{ marginBottom: "5px", width: "100%" }} className="text-input" />
                        <input type="email" placeholder={t('common.email')} value={c.email} onChange={(e) => handleCoAuthorChange(idx, "email", e.target.value)} style={{ marginBottom: "5px", width: "100%" }} className="text-input" />
                        <input type="text" placeholder={t('common.affiliation')} value={c.affiliation} onChange={(e) => handleCoAuthorChange(idx, "affiliation", e.target.value)} style={{ width: "100%" }} className="text-input" />
                        <button type="button" onClick={() => removeCoAuthor(idx)} style={{ marginTop: "5px", color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>{t('app.delete')}</button>
                      </div>
                    ))}
                    <div className="field-hint">{t('author.newSubmission.coAuthorsHint')}</div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate("/author/submissions")}>{t('app.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={submitting || aiLoading}>{submitting ? t('app.loading') : t('author.form.submitPaper')}</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <AIModal isOpen={!!grammarResult} title={`${t('author.newSubmission.grammarCheck')}: ${grammarResult?.field}`} onClose={() => setGrammarResult(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <strong style={{ display: "block", marginBottom: "8px", color: "#374151", fontSize: "0.9375rem" }}>{t('author.newSubmission.originalText')}:</strong>
            <p style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", margin: 0, lineHeight: "1.6", fontSize: "0.9375rem", color: "#1f2937" }}>{grammarResult?.originalText}</p>
          </div>
          {grammarResult?.errors && grammarResult.errors.length > 0 ? (
            <div style={{ color: "#d97706", background: "#fef3c7", padding: "10px 12px", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 500 }}>
              ⚠️ {t('author.newSubmission.foundIssues', { count: grammarResult.errors.length })}
            </div>
          ) : (
            <div style={{ color: "#059669", background: "#d1fae5", padding: "10px 12px", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 500 }}>
              ✓ {t('author.newSubmission.noErrors')}
            </div>
          )}
          <div>
            <strong style={{ display: "block", marginBottom: "8px", color: "#374151", fontSize: "0.9375rem" }}>{t('author.newSubmission.suggestedCorrection')}:</strong>
            <p style={{ background: "#eff6ff", padding: "12px", borderRadius: "8px", border: "1px solid #3b82f6", margin: 0, lineHeight: "1.6", fontSize: "0.9375rem", color: "#1f2937" }}>{grammarResult?.correctedText}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
            <button className="btn-secondary" onClick={() => setGrammarResult(null)} style={{ minWidth: "100px" }}>{t('app.close')}</button>
            <button className="btn-primary" onClick={() => applyCorrection(grammarResult.correctedText, grammarResult.field)} style={{ minWidth: "160px" }}>{t('author.newSubmission.useSuggestion')}</button>
          </div>
        </div>
      </AIModal>

      <AIModal isOpen={!!polishResult} title={t('author.newSubmission.polishCompare')} onClose={() => setPolishResult(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <h4 style={{ textAlign: "center", margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 600, color: "#374151", padding: "8px", background: "#fce7f3", borderRadius: "6px" }}>{t('author.newSubmission.original')}</h4>
              <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca", minHeight: "200px", whiteSpace: "pre-wrap", lineHeight: "1.6", fontSize: "0.9375rem", color: "#1f2937" }}>{polishResult?.originalText}</div>
            </div>
            <div>
              <h4 style={{ textAlign: "center", margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 600, color: "#374151", padding: "8px", background: "#d1fae5", borderRadius: "6px" }}>{t('author.newSubmission.improved')}</h4>
              <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "8px", border: "1px solid #6ee7b7", minHeight: "200px", whiteSpace: "pre-wrap", lineHeight: "1.6", fontSize: "0.9375rem", color: "#1f2937" }}>{polishResult?.polishedText}</div>
            </div>
          </div>
          {polishResult?.comment && (
            <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
              <strong style={{ color: "#1e40af", fontSize: "0.875rem" }}>💡 {t('author.newSubmission.aiComment')}:</strong>
              <p style={{ margin: "8px 0 0 0", color: "#1f2937", fontSize: "0.875rem", lineHeight: "1.5" }}>{polishResult.comment}</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
            <button className="btn-secondary" onClick={() => setPolishResult(null)} style={{ minWidth: "100px" }}>{t('app.cancel')}</button>
            <button className="btn-primary" onClick={() => applyPolish(polishResult.polishedText)} style={{ minWidth: "140px" }}>{t('author.newSubmission.applyChanges')}</button>
          </div>
        </div>
      </AIModal>

      {aiLoading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#4f46e5" }}>{t('author.newSubmission.processingAI')}</div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AuthorNewSubmissionPage;
