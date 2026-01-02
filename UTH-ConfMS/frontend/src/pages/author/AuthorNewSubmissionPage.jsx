// src/pages/author/AuthorNewSubmissionPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";

// Modal component for simple AI capabilities (internal use here)
const AIModal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: "20px",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#1f2937"
        }}>{title}</h3>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f3f4f6",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e5e7eb";
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const formatDateTime = (value) => {
  if (!value) return "Đang cập nhật";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const AuthorNewSubmissionPage = () => {
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

  const [formValues, setFormValues] = useState({
    title: "",
    abstractText: "",
    keywords: "",
    trackId: "",
  });
  const [file, setFile] = useState(null);
  const [coAuthors, setCoAuthors] = useState([
    { name: "", email: "", affiliation: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null); // { originalText, correctedText, errors: [] }
  const [polishResult, setPolishResult] = useState(null); // { originalText, polishedText, comment }
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);

  // Load Confs
  useEffect(() => {
    let ignore = false;
    const loadConferences = async () => {
      try {
        setLoadingConfs(true);
        setConfListError("");
        const res = await apiClient.get("/conferences", {
          skipAuth: true,
        });
        if (ignore) return;
        setConferences(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (ignore) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }
        setConfListError("Không tải được danh sách hội nghị.");
      } finally {
        if (!ignore) setLoadingConfs(false);
      }
    };
    loadConferences();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!confId) return;
    let ignore = false;
    const loadConference = async () => {
      setLoadingConf(true);
      setConfError("");
      try {
        const res = await apiClient.get(`/conferences/${confId}`, {
          skipAuth: true,
        });
        if (ignore) return;
        setConference(res.data);
        const fetchedTracks = res.data?.tracks || [];
        setTracks(fetchedTracks);
        if (fetchedTracks.length) {
          setFormValues((prev) => ({
            ...prev,
            trackId: prev.trackId || (fetchedTracks[0].id ? String(fetchedTracks[0].id) : ""),
          }));
        }
      } catch (err) {
        if (!ignore) {
          setConfError("Không tải được thông tin hội nghị.");
        }
      } finally {
        if (!ignore) setLoadingConf(false);
      }
    };
    loadConference();
    return () => {
      ignore = true;
    };
  }, [confId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    setFile(uploaded || null);
  };

  const handleCoAuthorChange = (index, field, value) => {
    setCoAuthors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addCoAuthor = () => {
    setCoAuthors((prev) => [...prev, { name: "", email: "", affiliation: "" }]);
  };

  const removeCoAuthor = (index) => {
    setCoAuthors((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Handlers
  const handleCheckGrammar = async (field) => {
    const text = field === "Title" ? formValues.title : formValues.abstractText;
    const fieldVN = field === "Title" ? "Tiêu đề" : "Tóm tắt";
    if (!text || text.trim().length < 5) {
      alert(`Vui lòng nhập ${fieldVN} trước khi kiểm tra.`);
      return;
    }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/grammar-check", {
        text: text,
        fieldName: field,
        conferenceId: confId ? parseInt(confId) : null,
      });
      setGrammarResult({ ...res.data, field: fieldVN });
    } catch (err) {
      alert("Lỗi khi kiểm tra ngữ pháp: " + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handlePolish = async () => {
    const text = formValues.abstractText;
    if (!text || text.trim().length < 10) {
      alert("Vui lòng nhập Tóm tắt trước khi đánh bóng.");
      return;
    }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/polish", {
        content: text,
        type: "abstract",
        conferenceId: confId ? parseInt(confId) : null,
      });
      setPolishResult(res.data);
    } catch (err) {
      alert("Lỗi khi cải thiện nội dung: " + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestKeywords = async () => {
    if (!formValues.title || !formValues.abstractText) {
      alert("Vui lòng nhập Tiêu đề và Tóm tắt để AI gợi ý từ khóa.");
      return;
    }
    try {
      setAiLoading(true);
      const res = await apiClient.post("/ai/suggest-keywords", {
        title: formValues.title,
        abstractText: formValues.abstractText,
        maxKeywords: 5,
        conferenceId: confId ? parseInt(confId) : null,
      });
      setKeywordSuggestions(res.data.keywords || []);
    } catch (err) {
      alert("Lỗi khi gợi ý từ khóa.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyCorrection = (correctedText, field) => {
    if (field === "Tiêu đề") {
      setFormValues((prev) => ({ ...prev, title: correctedText }));
    } else {
      setFormValues((prev) => ({ ...prev, abstractText: correctedText }));
    }
    setGrammarResult(null);
  };

  const applyPolish = (polishedText) => {
    setFormValues((prev) => ({ ...prev, abstractText: polishedText }));
    setPolishResult(null);
  };

  const addKeyword = (kw) => {
    setFormValues((prev) => {
      const current = prev.keywords ? prev.keywords.split(";").map(k => k.trim()).filter(Boolean) : [];
      if (!current.includes(kw)) {
        return { ...prev, keywords: [...current, kw].join("; ") };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const payloadTrackId =
      formValues.trackId || (tracks[0]?.id ? String(tracks[0].id) : "");

    if (!payloadTrackId) {
      setError("Vui lòng chọn Track/Chủ đề cho bài báo.");
      return;
    }

    if (!file) {
      setError("Vui lòng chọn file PDF bài báo để nộp.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("abstract", formValues.abstractText);
      formData.append("trackId", payloadTrackId);
      if (formValues.keywords) {
        formData.append("keywords", formValues.keywords);
      }
      if (coAuthors?.length) {
        const filled = coAuthors.filter(
          (c) => c.name?.trim() || c.email?.trim() || c.affiliation?.trim()
        );
        if (filled.length) {
          formData.append("coAuthors", JSON.stringify(filled));
        }
      }
      formData.append("file", file);

      await apiClient.post("/submissions", formData);
      setSuccessMessage("Nộp bài thành công.");
      setTimeout(() => {
        navigate("/author/submissions");
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Không thể nộp bài.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page">
      <PortalHeader ctaHref="/author/dashboard" ctaText="Bảng điều khiển tác giả" />
      <main className="dash-main">
        <section className="dash-section">
          <div className="data-page-header">
            <div className="data-page-header-left">
              <div className="breadcrumb">
                <Link to="/" className="breadcrumb-link">Portal</Link>
                <span className="breadcrumb-separator">/</span>
                <Link to="/author/submissions" className="breadcrumb-link">Bài nộp của tôi</Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Nộp bài mới</span>
              </div>
              <h1 className="data-page-title">Nộp bài mới</h1>
              <p className="data-page-subtitle">Điền thông tin và tải file PDF để gửi cho hội nghị.</p>
            </div>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {successMessage && <div className="auth-success" style={{ marginBottom: "1rem" }}>{successMessage}</div>}

          {/* Conference Selection */}
          <div className="form-card" style={{ marginTop: "1rem" }}>
            <div style={{ marginBottom: "1rem", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
              <label><b>Chọn hội nghị: </b></label>
              <select
                className="select-input"
                style={{ maxWidth: "300px", marginLeft: "10px" }}
                value={confId || ""}
                onChange={(e) => e.target.value ? navigate(`/author/submissions/new?confId=${e.target.value}`) : navigate("/author/submissions/new")}
              >
                <option value="">-- Chọn hội nghị --</option>
                {conferences.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <form className="submission-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="title">Tiêu đề bài báo <span style={{ color: "red" }}>*</span></label>
                      <button
                        type="button"
                        onClick={() => handleCheckGrammar("Title")}
                        disabled={aiLoading}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          cursor: aiLoading ? "not-allowed" : "pointer",
                          opacity: aiLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)"
                        }}
                        onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 4px 8px rgba(102, 126, 234, 0.4)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 2px 4px rgba(102, 126, 234, 0.3)")}
                      >
                        <span style={{ fontSize: "1rem" }}>✨</span>
                        Check lỗi
                      </button>
                    </div>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      className="text-input"
                      required
                      value={formValues.title}
                      onChange={handleChange}
                      placeholder="Ví dụ: Ứng dụng AI trong giao thông thông minh"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="abstractText">Tóm tắt <span style={{ color: "red" }}>*</span></label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleCheckGrammar("Abstract")}
                          disabled={aiLoading}
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            cursor: aiLoading ? "not-allowed" : "pointer",
                            opacity: aiLoading ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s",
                            boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)"
                          }}
                          onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 4px 8px rgba(102, 126, 234, 0.4)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 2px 4px rgba(102, 126, 234, 0.3)")}
                        >
                          <span style={{ fontSize: "1rem" }}>✨</span>
                          Check lỗi
                        </button>
                        <button
                          type="button"
                          onClick={handlePolish}
                          disabled={aiLoading}
                          style={{
                            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                            color: "#1e293b",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            cursor: aiLoading ? "not-allowed" : "pointer",
                            opacity: aiLoading ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s",
                            boxShadow: "0 2px 4px rgba(168, 237, 234, 0.3)"
                          }}
                          onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 4px 8px rgba(168, 237, 234, 0.4)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 2px 4px rgba(168, 237, 234, 0.3)")}
                        >
                          <span style={{ fontSize: "1rem" }}>✨</span>
                          Văn phong
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="abstractText"
                      name="abstractText"
                      className="textarea-input"
                      required
                      value={formValues.abstractText}
                      onChange={handleChange}
                      style={{ minHeight: "150px" }}
                      placeholder="Mô tả ngắn gọn nội dung, phương pháp và kết quả chính..."
                    />
                    <div className="field-hint">
                      Khoảng 150–300 từ, tiếng Anh hoặc tiếng Việt tùy theo yêu cầu hội nghị.
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor="keywords">Từ khóa </label>
                      <button
                        type="button"
                        onClick={handleSuggestKeywords}
                        disabled={aiLoading}
                        style={{
                          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          cursor: aiLoading ? "not-allowed" : "pointer",
                          opacity: aiLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 4px rgba(79, 172, 254, 0.3)"
                        }}
                        onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 4px 8px rgba(79, 172, 254, 0.4)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 2px 4px rgba(79, 172, 254, 0.3)")}
                      >
                        <span style={{ fontSize: "1rem" }}>✨</span>
                        Gợi ý từ khóa
                      </button>
                    </div>
                    <input
                      id="keywords"
                      name="keywords"
                      type="text"
                      className="text-input"
                      value={formValues.keywords}
                      onChange={handleChange}
                      placeholder="Ví dụ: AI, Machine Learning, Smart City"
                    />
                    <div className="field-hint">
                      Phân tách từ khóa bằng dấu chấm phẩy (;).
                    </div>
                    {keywordSuggestions.length > 0 && (
                      <div style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                        <b>Gợi ý: </b>
                        {keywordSuggestions.map((kw, idx) => (
                          <span
                            key={idx}
                            onClick={() => addKeyword(kw)}
                            style={{
                              cursor: "pointer",
                              background: "#eef2ff",
                              color: "#4f46e5",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              marginRight: "5px",
                              display: "inline-block",
                              marginTop: "2px"
                            }}
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {/* Track Selection */}
                  <div className="form-group">
                    <label htmlFor="trackId">Chủ đề <span style={{ color: "red" }}>*</span></label>
                    <select
                      id="trackId"
                      name="trackId"
                      className="text-input"
                      required
                      value={formValues.trackId}
                      onChange={handleChange}
                      disabled={!conference || tracks.length === 0}
                    >
                      <option value="">-- Chọn Track --</option>
                      {tracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                    <div className="field-hint">
                      {!conference 
                        ? "Vui lòng chọn hội nghị trước"
                        : tracks.length === 0 
                        ? "Hội nghị này chưa có track nào"
                        : "Chọn track/chủ đề phù hợp với bài báo của bạn"}
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="form-group">
                    <label htmlFor="file">File bài báo (PDF) <span style={{ color: "red" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <label 
                        htmlFor="file"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          width: "100%",
                          padding: "0.875rem 1rem",
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          background: "transparent",
                          fontSize: "0.95rem",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          padding: "6px 16px",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          whiteSpace: "nowrap"
                        }}>
                          Chọn tệp
                        </span>
                        <span style={{ 
                          color: file ? "#059669" : "#64748b",
                          fontWeight: file ? 500 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {file ? file.name : "Không có tệp nào được chọn"}
                        </span>
                      </label>
                    </div>
                    <div className="field-hint">
                      Chỉ chấp nhận file PDF, dung lượng theo quy định. Không nhúng thông tin tác giả (Double-blind).
                    </div>
                  </div>

                  {/* Co-Authors */}
                  <div className="form-group">
                    <label>Đồng tác giả (Tùy chọn)</label>
                    <button type="button" className="btn-secondary" onClick={addCoAuthor} style={{ marginLeft: "10px", padding: "2px 6px", fontSize: "0.8rem" }}>+ Thêm</button>
                    {coAuthors.map((c, idx) => (
                      <div key={idx} style={{ marginTop: "10px", padding: "10px", border: "1px dashed #ccc", borderRadius: "5px" }}>
                        <input type="text" placeholder="Họ tên" value={c.name} onChange={(e) => handleCoAuthorChange(idx, "name", e.target.value)} style={{ marginBottom: "5px", width: "100%" }} className="text-input" />
                        <input type="email" placeholder="Email" value={c.email} onChange={(e) => handleCoAuthorChange(idx, "email", e.target.value)} style={{ marginBottom: "5px", width: "100%" }} className="text-input" />
                        <input type="text" placeholder="Đơn vị / Affiliation" value={c.affiliation} onChange={(e) => handleCoAuthorChange(idx, "affiliation", e.target.value)} style={{ width: "100%" }} className="text-input" />
                        <button type="button" onClick={() => removeCoAuthor(idx)} style={{ marginTop: "5px", color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>Xóa</button>
                      </div>
                    ))}
                    <div className="field-hint">
                      Điền ít nhất tên hoặc email để lưu đồng tác giả.
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate("/author/submissions")}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={submitting || aiLoading}>{submitting ? "Đang gửi..." : "Gửi bài báo"}</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Grammar Modal */}
      <AIModal
        isOpen={!!grammarResult}
        title={`Kiểm tra ngôn ngữ: ${grammarResult?.field}`}
        onClose={() => setGrammarResult(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <strong style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#374151",
              fontSize: "0.9375rem"
            }}>Văn bản gốc:</strong>
            <p style={{ 
              background: "#f9fafb", 
              padding: "12px", 
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              margin: 0,
              lineHeight: "1.6",
              fontSize: "0.9375rem",
              color: "#1f2937"
            }}>{grammarResult?.originalText}</p>
          </div>
          {grammarResult?.errors && grammarResult.errors.length > 0 ? (
            <div style={{ 
              color: "#d97706",
              background: "#fef3c7",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500
            }}>
              ⚠️ Tìm thấy {grammarResult.errors.length} vấn đề cần lưu ý.
            </div>
          ) : (
            <div style={{ 
              color: "#059669",
              background: "#d1fae5",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500
            }}>
              ✓ Không tìm thấy lỗi ngữ pháp/chính tả nào!
            </div>
          )}

          <div>
            <strong style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#374151",
              fontSize: "0.9375rem"
            }}>Bản sửa đổi (Đề xuất):</strong>
            <p style={{ 
              background: "#eff6ff", 
              padding: "12px", 
              borderRadius: "8px",
              border: "1px solid #3b82f6",
              margin: 0,
              lineHeight: "1.6",
              fontSize: "0.9375rem",
              color: "#1f2937"
            }}>
              {grammarResult?.correctedText}
            </p>
          </div>

          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            gap: "10px",
            marginTop: "8px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <button 
              className="btn-secondary" 
              onClick={() => setGrammarResult(null)}
              style={{ minWidth: "100px" }}
            >
              Đóng
            </button>
            <button 
              className="btn-primary" 
              onClick={() => applyCorrection(grammarResult.correctedText, grammarResult.field)}
              style={{ minWidth: "160px" }}
            >
              Dùng bản sửa đổi này
            </button>
          </div>
        </div>
      </AIModal>

      {/* Polish Modal */}
      <AIModal
        isOpen={!!polishResult}
        title="Cải thiện nội dung (So sánh)"
        onClose={() => setPolishResult(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "16px",
            "@media (max-width: 768px)": {
              gridTemplateColumns: "1fr"
            }
          }}>
            <div>
              <h4 style={{ 
                textAlign: "center",
                margin: "0 0 12px 0",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#374151",
                padding: "8px",
                background: "#fce7f3",
                borderRadius: "6px"
              }}>Gốc</h4>
              <div style={{ 
                background: "#fef2f2", 
                padding: "12px", 
                borderRadius: "8px",
                border: "1px solid #fecaca",
                minHeight: "200px", 
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                fontSize: "0.9375rem",
                color: "#1f2937"
              }}>
                {polishResult?.originalText}
              </div>
            </div>
            <div>
              <h4 style={{ 
                textAlign: "center",
                margin: "0 0 12px 0",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#374151",
                padding: "8px",
                background: "#d1fae5",
                borderRadius: "6px"
              }}>Đã cải thiện (AI)</h4>
              <div style={{ 
                background: "#ecfdf5", 
                padding: "12px", 
                borderRadius: "8px",
                border: "1px solid #6ee7b7",
                minHeight: "200px", 
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                fontSize: "0.9375rem",
                color: "#1f2937"
              }}>
                {polishResult?.polishedText}
              </div>
            </div>
          </div>
          
          {polishResult?.comment && (
            <div style={{
              background: "#eff6ff",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #bfdbfe"
            }}>
              <strong style={{ 
                color: "#1e40af",
                fontSize: "0.875rem"
              }}>💡 AI Nhận xét:</strong>
              <p style={{ 
                margin: "8px 0 0 0",
                color: "#1f2937",
                fontSize: "0.875rem",
                lineHeight: "1.5"
              }}>
                {polishResult.comment}
              </p>
            </div>
          )}
          
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            gap: "10px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <button 
              className="btn-secondary" 
              onClick={() => setPolishResult(null)}
              style={{ minWidth: "100px" }}
            >
              Hủy
            </button>
            <button 
              className="btn-primary" 
              onClick={() => applyPolish(polishResult.polishedText)}
              style={{ minWidth: "140px" }}
            >
              Áp dụng thay đổi
            </button>
          </div>
        </div>
      </AIModal>

      {/* Loading Overlay */}
      {aiLoading && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255,255,255,0.7)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#4f46e5" }}>
            Đang xử lý với AI...
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorNewSubmissionPage;
