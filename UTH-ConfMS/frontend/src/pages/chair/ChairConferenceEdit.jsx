import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ChairConferenceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    reviewDeadline: "",
    cameraReadyDeadline: "",
    blindReview: true,
    tracks: [],
  });

  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchConf = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/conferences/${id}`);
        const data = res.data;

        setFormData({
          name: data.name || "",
          description: data.description || "",
          startDate: formatDateTimeForInput(data.startDate),
          endDate: formatDateTimeForInput(data.endDate),
          submissionDeadline: formatDateTimeForInput(data.submissionDeadline),
          reviewDeadline: formatDateTimeForInput(data.reviewDeadline),
          cameraReadyDeadline: formatDateTimeForInput(data.cameraReadyDeadline),
          blindReview: data.blindReview !== undefined ? data.blindReview : true,
          tracks: data.tracks || [],
        });
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu hội nghị.");
      } finally {
        setLoading(false);
      }
    };
    fetchConf();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTrackChange = (index, value) => {
    const newTracks = [...formData.tracks];
    newTracks[index] = { ...newTracks[index], name: value };
    setFormData({ ...formData, tracks: newTracks });
  };

  const addTrack = () => {
    setFormData({ ...formData, tracks: [...formData.tracks, { name: "" }] });
  };

  const removeTrack = (index) => {
    const newTracks = formData.tracks.filter((_, i) => i !== index);
    setFormData({ ...formData, tracks: newTracks });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    try {
      setSaving(true);
      const cleanTracks = formData.tracks.filter((t) => t.name && t.name.trim() !== "");

      const payload = {
        ...formData,
        tracks: cleanTracks,
      };

      await apiClient.put(`/conferences/${id}`, payload);
      alert("Cập nhật thành công!");
      navigate("/chair/conferences");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data || "Lưu thất bại.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <DashboardLayout roleLabel="Program Chair" title="Đang tải...">
        <div className="form-card">Đang tải dữ liệu...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout roleLabel="Program Chair" title={`Sửa Hội Nghị #${id}`} subtitle="Cập nhật thông tin chi tiết và danh sách tracks.">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/chair/conferences" className="breadcrumb-link">
              Hội nghị
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Chỉnh sửa #{id}</span>
          </div>
          <h2 className="data-page-title">Cập nhật thông tin hội nghị</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="submission-form" style={{ maxWidth: 960, margin: "0 auto" }}>
        {error && (
          <div style={{ 
            background: "#fef2f2", 
            border: "1px solid #fecaca", 
            borderRadius: "8px",
            padding: "1rem", 
            color: "#991b1b",
            marginBottom: "1.5rem"
          }}>
            {error}
          </div>
        )}

        <h3 style={{ 
          marginBottom: "1rem", 
          fontSize: "1rem", 
          fontWeight: 600,
          color: "#111827"
        }}>
          Thông tin chung
        </h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Tên hội nghị *</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="Ví dụ: UTH Conference 2025"
              style={{ fontSize: "0.95rem" }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Mô tả chi tiết *</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={4} 
              required 
              className="textarea-input"
              style={{ fontSize: "0.95rem", lineHeight: "1.6" }}
            />
          </div>
          <label className="checkbox" style={{ fontSize: "0.95rem" }}>
            <input type="checkbox" name="blindReview" checked={formData.blindReview} onChange={handleChange} />
            <span style={{ marginLeft: "0.5rem" }}>Bật chế độ Blind Review (Phản biện kín)</span>
          </label>
        </div>

        <h3 style={{ 
          marginBottom: "1rem", 
          fontSize: "1rem", 
          fontWeight: 600,
          color: "#111827"
        }}>
          Thời gian tổ chức
        </h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Ngày bắt đầu *</label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Ngày kết thúc *</label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn nộp bài</label>
            <input type="datetime-local" name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} />
            <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
              Thời hạn tác giả nộp bài báo
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn chấm bài</label>
              <input type="datetime-local" name="reviewDeadline" value={formData.reviewDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Thời hạn reviewer hoàn thành đánh giá
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn nộp bản cuối</label>
              <input type="datetime-local" name="cameraReadyDeadline" value={formData.cameraReadyDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Thời hạn nộp bản cuối sau khi được chấp nhận
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ 
          marginBottom: "1rem", 
          fontSize: "1rem", 
          fontWeight: 600,
          color: "#111827"
        }}>
          Danh sách Tracks
        </h3>
        <div style={{ 
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          marginBottom: "1.5rem"
        }}>
          {formData.tracks.map((track, index) => (
            <div key={index} style={{ 
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              background: "#f9fafb",
              borderRadius: "8px",
              marginBottom: "0.75rem",
              border: "1px solid #e5e7eb"
            }}>
              <span style={{ 
                color: "#6b7280", 
                minWidth: "32px",
                fontWeight: 600,
                fontSize: "0.9rem"
              }}>
                {index + 1}.
              </span>
              <input 
                style={{ 
                  flex: 1, 
                  minWidth: 0, 
                  fontSize: "0.95rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "0.5rem 0.75rem"
                }} 
                placeholder="Tên track (VD: AI, Security...)" 
                value={track.name} 
                onChange={(e) => handleTrackChange(index, e.target.value)} 
              />
              <button 
                type="button" 
                className="btn-secondary table-action" 
                style={{ 
                  color: "#dc2626", 
                  fontWeight: 500,
                  padding: "0.5rem 1rem",
                  borderRadius: "6px"
                }} 
                onClick={() => removeTrack(index)}
              >
                Xóa
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="btn-secondary table-action" 
            onClick={addTrack}
            style={{ 
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px"
            }}
          >
            Thêm Track
          </button>
        </div>

        <div className="form-actions" style={{ 
          marginTop: "2rem", 
          display: "flex", 
          gap: "1rem",
          paddingTop: "1.5rem",
          borderTop: "2px solid #e5e7eb"
        }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ minWidth: "140px" }}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate("/chair/conferences")}
            style={{ minWidth: "120px" }}
          >
            Quay lại
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default ChairConferenceEdit;
