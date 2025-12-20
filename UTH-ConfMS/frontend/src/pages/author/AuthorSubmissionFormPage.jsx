// src/pages/author/AuthorSubmissionFormPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import { getConferencesAPI } from "../../api/conferenceAPI";
import { submitPaperAPI } from "../../api/submissionAPI";

const AuthorSubmissionFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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

  // Load conferences on mount
  useEffect(() => {
    loadConferences();
  }, []);

  const loadConferences = async () => {
    try {
      const data = await getConferencesAPI();
      setConferences(data);
    } catch (err) {
      console.error("Error loading conferences:", err);
      setError("Không thể tải danh sách hội nghị");
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

    // Validate file
    if (!file.type.includes('pdf')) {
      setFileError("Chỉ chấp nhận file PDF");
      e.target.value = null;
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError("Kích thước file vượt quá 25MB");
      e.target.value = null;
      return;
    }

    if (file.size < 1024) {
      setFileError("File quá nhỏ, có thể bị hỏng");
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
      alert("Vui lòng nhập tên và email của đồng tác giả");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coAuthorForm.email)) {
      alert("Email không hợp lệ");
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
    setError(null);
    setSuccess(false);

    if (!form.file) {
      setError("Vui lòng chọn file PDF để nộp");
      return;
    }

    if (!form.trackId) {
      setError("Vui lòng chọn Track cho bài báo");
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
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/author/submissions');
      }, 2000);

    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.message || err.message || "Lỗi khi nộp bài. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      roleLabel="Author"
      title="Nộp bài mới"
      subtitle="Nhập thông tin bài báo và tải lên file PDF theo hướng dẫn của hội nghị."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/author" className="breadcrumb-link">
              Author Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/author/submissions" className="breadcrumb-link">
              Submissions
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Nộp bài mới</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <strong>Thành công!</strong> Bài báo đã được nộp. Đang chuyển hướng...
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="conferenceId">Hội nghị *</label>
              <select
                id="conferenceId"
                name="conferenceId"
                value={form.conferenceId || ""}
                onChange={handleConferenceChange}
                required
                className="select-input"
                disabled={loading}
              >
                <option value="">-- Chọn hội nghị --</option>
                {conferences.map(conf => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trackId">Track / Chủ đề *</label>
              <select
                id="trackId"
                name="trackId"
                value={form.trackId}
                onChange={handleChange}
                required
                className="select-input"
                disabled={loading || tracks.length === 0}
              >
                <option value="">-- Chọn track --</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Tiêu đề bài báo *</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Ví dụ: A Study on Smart Transportation at UTH"
              value={form.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="abstract">Tóm tắt (abstract) *</label>
            <textarea
              id="abstract"
              name="abstract"
              rows={5}
              placeholder="Nhập tóm tắt 150–250 từ theo yêu cầu của hội nghị..."
              value={form.abstract}
              onChange={handleChange}
              required
              className="textarea-input"
              disabled={loading}
            />
          </div>

          {/* Co-Authors Section */}
          <div className="form-group">
            <label>Đồng tác giả (Co-Authors)</label>
            
            {/* Display added co-authors */}
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
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add co-author form */}
            <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label htmlFor="coAuthorName">Tên *</label>
                  <input
                    id="coAuthorName"
                    name="name"
                    type="text"
                    placeholder="Tên đồng tác giả"
                    value={coAuthorForm.name}
                    onChange={handleCoAuthorChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="coAuthorEmail">Email *</label>
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
                <label htmlFor="coAuthorAffiliation">Đơn vị/Trường</label>
                <input
                  id="coAuthorAffiliation"
                  name="affiliation"
                  type="text"
                  placeholder="Đơn vị công tác"
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
                + Thêm đồng tác giả
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="file">File PDF *</label>
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
              Chỉ chấp nhận file PDF, tối đa 25MB. File phải là PDF thực sự, không phải file đổi tên.
            </div>
            {fileError && (
              <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fileError}
              </div>
            )}
          </div>

          {/* Co-Authors Section */}
          <div className="form-section">
            <h3>Đồng tác giả (Co-Authors)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="coAuthorName">Tên đồng tác giả</label>
                <input
                  id="coAuthorName"
                  name="name"
                  type="text"
                  placeholder="Họ và tên"
                  value={coAuthorForm.name}
                  onChange={handleCoAuthorChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="coAuthorEmail">Email</label>
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
            <div className="form-group">
              <label htmlFor="coAuthorAffiliation">Cơ quan / Trường</label>
              <input
                id="coAuthorAffiliation"
                name="affiliation"
                type="text"
                placeholder="Tên cơ quan / trường"
                value={coAuthorForm.affiliation}
                onChange={handleCoAuthorChange}
                disabled={loading}
              />
            </div>
            <button 
              type="button" 
              onClick={addCoAuthor}
              className="btn-secondary"
              disabled={loading}
              style={{ marginBottom: '1rem' }}
            >
              + Thêm đồng tác giả
            </button>

            {form.coAuthors.length > 0 && (
              <div className="coauthors-list">
                <h4>Danh sách đồng tác giả:</h4>
                {form.coAuthors.map((coAuthor, index) => (
                  <div key={index} className="coauthor-item" style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>{coAuthor.name}</strong> - {coAuthor.email}
                      {coAuthor.affiliation && <div style={{ fontSize: '0.875rem', color: '#666' }}>{coAuthor.affiliation}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoAuthor(index)}
                      className="btn-danger"
                      disabled={loading}
                      style={{ padding: '0.25rem 0.75rem' }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/author/submissions" className="btn-secondary">
              Hủy &amp; quay lại danh sách
            </Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi submission'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AuthorSubmissionFormPage;
