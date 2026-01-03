import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { ToastContainer } from "../../components/Toast";

const ChairConferenceCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    reviewDeadline: "",
    cameraReadyDeadline: "",
    blindReview: true,
    tracks: [{ name: "", description: "", sessionDate: "", sessionTime: "", room: "" }],
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTrackChange = (index, field, value) => {
    const newTracks = [...formData.tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setFormData({ ...formData, tracks: newTracks });
  };

  const addTrack = () => {
    setFormData({ 
      ...formData, 
      tracks: [...formData.tracks, { name: "", description: "", sessionDate: "", sessionTime: "", room: "" }] 
    });
  };

  const removeTrack = (index) => {
    const newTracks = formData.tracks.filter((_, i) => i !== index);
    setFormData({ ...formData, tracks: newTracks });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      addToast("Vui lòng điền tên, ngày bắt đầu và ngày kết thúc!", "warning");
      return;
    }

    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(formData.startDate);
      const endDateTime = new Date(formData.endDate);
      
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        addToast("Thời gian kết thúc phải sau thời gian bắt đầu!", "error");
        return;
      }
    }

    const cleanTracks = formData.tracks.filter((t) => t.name.trim() !== "");

    const convertToISO = (dateTimeLocal) => {
      if (!dateTimeLocal) return null;
      return dateTimeLocal + ':00';
    };

    const payload = {
      ...formData,
      startDate: convertToISO(formData.startDate),
      endDate: convertToISO(formData.endDate),
      submissionDeadline: convertToISO(formData.submissionDeadline),
      reviewDeadline: convertToISO(formData.reviewDeadline),
      cameraReadyDeadline: convertToISO(formData.cameraReadyDeadline),
      tracks: cleanTracks,
    };

    try {
      setSubmitting(true);
      await apiClient.post(`/conferences`, payload);
      addToast("Tạo hội nghị thành công!", "success");
      setTimeout(() => navigate("/chair/conferences"), 800);
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data || "Tạo thất bại";
      addToast(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      roleLabel="Chair"
      title="Tạo Hội Nghị Mới"
      subtitle="Điền thông tin chi tiết để tạo hội nghị khoa học mới"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/chair/conferences" className="breadcrumb-link">
              Hội nghị
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tạo mới</span>
          </div>
          <h2 className="data-page-title">Tạo hội nghị mới</h2>
        </div>
      </div>

      <form onSubmit={handleCreate} className="submission-form" style={{ maxWidth: 960, margin: "0 auto" }}>

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Thông tin chung</h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Tên hội nghị *</label>
            <input name="name" value={formData.name} onChange={handleChange} required placeholder="Ví dụ: UTH Conference 2025" style={{ fontSize: "0.95rem" }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Mô tả chi tiết *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="textarea-input" placeholder="Giới thiệu ngắn gọn về hội nghị..." style={{ fontSize: "0.95rem", lineHeight: "1.6" }} />
          </div>
          <label className="checkbox" style={{ fontSize: "0.95rem" }}>
            <input type="checkbox" name="blindReview" checked={formData.blindReview} onChange={handleChange} />
            <span style={{ marginLeft: "0.5rem" }}>Bật chế độ Blind Review (Phản biện kín)</span>
          </label>
        </div>

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Thời gian tổ chức</h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Ngày bắt đầu *</label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Ngày kết thúc *</label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>Có thể cùng ngày, miễn giờ kết thúc sau giờ bắt đầu</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn nộp bài</label>
            <input type="datetime-local" name="submissionDeadline" value={formData.submissionDeadline} onChange={handleChange} />
            <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>Thời hạn tác giả nộp bài báo</div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn chấm bài</label>
              <input type="datetime-local" name="reviewDeadline" value={formData.reviewDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>Thời hạn reviewer hoàn thành đánh giá</div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 500, color: "#374151" }}>Hạn nộp bản cuối</label>
              <input type="datetime-local" name="cameraReadyDeadline" value={formData.cameraReadyDeadline} onChange={handleChange} />
              <div className="field-hint" style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>Thời hạn nộp bản cuối sau khi được chấp nhận</div>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Danh sách Tracks & Lịch trình</h3>
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", marginBottom: "1.5rem" }}>
          {formData.tracks.map((track, index) => (
            <div key={index} style={{ padding: "1.25rem", background: "#f9fafb", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ color: "#6b7280", minWidth: "32px", fontWeight: 600, fontSize: "0.9rem" }}>{index + 1}.</span>
                <input style={{ flex: 1, minWidth: 0, fontSize: "0.95rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} placeholder="Tên track (VD: AI, Security...)" value={track.name || ""} onChange={(e) => handleTrackChange(index, "name", e.target.value)} />
                <button type="button" className="btn-secondary table-action" style={{ color: "#dc2626", fontWeight: 500, padding: "0.5rem 1rem", borderRadius: "6px" }} onClick={() => removeTrack(index)}>Xóa</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginLeft: "40px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>Ngày tổ chức</label>
                  <input type="date" style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} value={track.sessionDate || ""} onChange={(e) => handleTrackChange(index, "sessionDate", e.target.value)} />
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>Phải trong khoảng thời gian hội nghị</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>Thời gian phiên</label>
                  <input style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} placeholder="VD: 09:00 - 11:00" value={track.sessionTime || ""} onChange={(e) => handleTrackChange(index, "sessionTime", e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>Phòng/Địa điểm</label>
                  <input style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem" }} placeholder="VD: Phòng 201" value={track.room || ""} onChange={(e) => handleTrackChange(index, "room", e.target.value)} />
                </div>
              </div>

              <div style={{ marginLeft: "40px", marginTop: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>Mô tả (tùy chọn)</label>
                <textarea style={{ width: "100%", fontSize: "0.9rem", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem 0.75rem", minHeight: "60px", resize: "vertical" }} placeholder="Mô tả ngắn về track này..." value={track.description || ""} onChange={(e) => handleTrackChange(index, "description", e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary table-action" onClick={addTrack} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", borderRadius: "6px" }}>+ Thêm Track</button>
        </div>

        <div className="form-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem", paddingTop: "1.5rem", borderTop: "2px solid #e5e7eb" }}>
          <button className="btn-primary" type="submit" disabled={submitting} style={{ minWidth: "140px" }}>{submitting ? "Đang tạo..." : "Tạo hội nghị"}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/chair/conferences")} style={{ minWidth: "120px" }}>Hủy</button>
        </div>
      </form>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ChairConferenceCreate;
