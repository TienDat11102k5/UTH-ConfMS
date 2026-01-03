import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import { ToastContainer } from "../../components/Toast";

const AdminConferenceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
    // Parse ISO string và giữ nguyên giờ đã lưu (đã là giờ VN)
    // Chỉ cần cắt bỏ phần timezone và milliseconds
    // VD: "2025-01-15T09:00:00+07:00" -> "2025-01-15T09:00"
    return isoString.slice(0, 16);
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

  const handleTrackChange = (index, field, value) => {
    const newTracks = [...formData.tracks];
    newTracks[index] = { ...newTracks[index], [field]: value };
    setFormData({ ...formData, tracks: newTracks });
  };

  const addTrack = () => {
    setFormData({ ...formData, tracks: [...formData.tracks, { name: "", description: "", sessionDate: "", sessionTime: "", room: "" }] });
  };

  const removeTrack = (index) => {
    const newTracks = formData.tracks.filter((_, i) => i !== index);
    setFormData({ ...formData, tracks: newTracks });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    // Validation: Kiểm tra thời gian hội nghị
    if (formData.startDate && formData.endDate) {
      // Parse datetime-local string thành Date object
      const startDateTime = new Date(formData.startDate);
      const endDateTime = new Date(formData.endDate);
      
      // Cho phép cùng ngày, chỉ cần giờ kết thúc sau giờ bắt đầu
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        setError("Thời gian kết thúc phải sau thời gian bắt đầu!");
        return;
      }
    }

    // Validation: Kiểm tra ngày session của tracks
    if (formData.startDate && formData.endDate) {
      const confStartDate = new Date(formData.startDate);
      const confEndDate = new Date(formData.endDate);
      
      // Chỉ lấy phần ngày (bỏ giờ) để so sánh
      confStartDate.setHours(0, 0, 0, 0);
      confEndDate.setHours(23, 59, 59, 999);
      
      for (let i = 0; i < formData.tracks.length; i++) {
        const track = formData.tracks[i];
        if (track.sessionDate && track.sessionDate.trim() !== "") {
          // Date picker trả về format YYYY-MM-DD
          const sessionDate = new Date(track.sessionDate + 'T00:00:00');
          
          if (!isNaN(sessionDate.getTime())) {
            if (sessionDate < confStartDate || sessionDate > confEndDate) {
              setError(`Track "${track.name}": Ngày session phải nằm trong khoảng thời gian hội nghị!`);
              return;
            }
          }
        }
      }
    }

    try {
      setSaving(true);
      const cleanTracks = formData.tracks.filter(
        (t) => t.name && t.name.trim() !== ""
      );

      // Convert datetime-local sang ISO string
      // datetime-local đã là giờ local (VN), chỉ cần thêm :00
      const convertToISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        // datetime-local format: "2025-01-15T09:00"
        // Thêm giây và chuyển sang ISO
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

      await apiClient.put(`/conferences/${id}`, payload);
      addToast("Cập nhật thành công!", "success");
      setTimeout(() => navigate("/admin/conferences"), 800);
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
      <AdminLayout title="Đang tải...">
        <div className="form-card">Đang tải dữ liệu...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout
      title={`Sửa Hội Nghị #${id}`}
      subtitle="Cập nhật thông tin chi tiết và danh sách chủ đề ."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/conferences" className="breadcrumb-link">
              Hội nghị
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Chỉnh sửa #{id}</span>
          </div>
          <h2 className="data-page-title">Cập nhật thông tin hội nghị</h2>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="submission-form"
        style={{ maxWidth: 960, margin: "0 auto" }}
      >
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1rem",
              color: "#991b1b",
              marginBottom: "1.5rem",
            }}
          >
            {error}
          </div>
        )}

        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Thông tin chung
        </h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label
              className="form-label"
              style={{ fontWeight: 500, color: "#374151" }}
            >
              Tên hội nghị *
            </label>
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
            <label
              className="form-label"
              style={{ fontWeight: 500, color: "#374151" }}
            >
              Mô tả chi tiết *
            </label>
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
            <input
              type="checkbox"
              name="blindReview"
              checked={formData.blindReview}
              onChange={handleChange}
            />
            <span style={{ marginLeft: "0.5rem" }}>
              Bật chế độ Blind Review (Phản biện kín)
            </span>
          </label>
        </div>

        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Thời gian tổ chức
        </h3>
        <div className="form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-grid">
            <div className="form-group">
              <label
                className="form-label"
                style={{ fontWeight: 500, color: "#374151" }}
              >
                Ngày bắt đầu *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label
                className="form-label"
                style={{ fontWeight: 500, color: "#374151" }}
              >
                Ngày kết thúc *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
              <div
                className="field-hint"
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Có thể cùng ngày, miễn giờ kết thúc sau giờ bắt đầu
              </div>
            </div>
          </div>

          <div className="form-group">
            <label
              className="form-label"
              style={{ fontWeight: 500, color: "#374151" }}
            >
              Hạn nộp bài
            </label>
            <input
              type="datetime-local"
              name="submissionDeadline"
              value={formData.submissionDeadline}
              onChange={handleChange}
            />
            <div
              className="field-hint"
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "0.25rem",
              }}
            >
              Thời hạn tác giả nộp bài báo
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label
                className="form-label"
                style={{ fontWeight: 500, color: "#374151" }}
              >
                Hạn chấm bài
              </label>
              <input
                type="datetime-local"
                name="reviewDeadline"
                value={formData.reviewDeadline}
                onChange={handleChange}
              />
              <div
                className="field-hint"
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Thời hạn reviewer hoàn thành đánh giá
              </div>
            </div>
            <div className="form-group">
              <label
                className="form-label"
                style={{ fontWeight: 500, color: "#374151" }}
              >
                Hạn nộp bản cuối
              </label>
              <input
                type="datetime-local"
                name="cameraReadyDeadline"
                value={formData.cameraReadyDeadline}
                onChange={handleChange}
              />
              <div
                className="field-hint"
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Thời hạn nộp bản cuối sau khi được chấp nhận
              </div>
            </div>
          </div>
        </div>

        <h3
          style={{
            marginBottom: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Danh sách Tracks & Lịch trình
        </h3>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            marginBottom: "1.5rem",
          }}
        >
          {formData.tracks.map((track, index) => (
            <div
              key={index}
              style={{
                padding: "1.25rem",
                background: "#f9fafb",
                borderRadius: "8px",
                marginBottom: "1rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    color: "#6b7280",
                    minWidth: "32px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {index + 1}.
                </span>
                <input
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: "0.95rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.5rem 0.75rem",
                  }}
                  placeholder="Tên track (VD: AI, Security...)"
                  value={track.name || ""}
                  onChange={(e) => handleTrackChange(index, 'name', e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary table-action"
                  style={{
                    color: "#dc2626",
                    fontWeight: 500,
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                  }}
                  onClick={() => removeTrack(index)}
                >
                  Xóa
                </button>
              </div>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.75rem",
                  marginLeft: "40px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Ngày tổ chức
                  </label>
                  <input
                    type="date"
                    style={{
                      width: "100%",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                    }}
                    value={track.sessionDate || ""}
                    onChange={(e) => handleTrackChange(index, 'sessionDate', e.target.value)}
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    Phải trong khoảng thời gian hội nghị
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Thời gian phiên
                  </label>
                  <input
                    style={{
                      width: "100%",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                    }}
                    placeholder="VD: 09:00 - 11:00"
                    value={track.sessionTime || ""}
                    onChange={(e) => handleTrackChange(index, 'sessionTime', e.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Phòng/Địa điểm
                  </label>
                  <input
                    style={{
                      width: "100%",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                    }}
                    placeholder="VD: Phòng 201"
                    value={track.room || ""}
                    onChange={(e) => handleTrackChange(index, 'room', e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ marginLeft: "40px", marginTop: "0.75rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "0.25rem",
                  }}
                >
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  style={{
                    width: "100%",
                    fontSize: "0.9rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.5rem 0.75rem",
                    minHeight: "60px",
                    resize: "vertical",
                  }}
                  placeholder="Mô tả ngắn về track này..."
                  value={track.description || ""}
                  onChange={(e) => handleTrackChange(index, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary table-action"
            onClick={addTrack}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
            }}
          >
            + Thêm Track
          </button>
        </div>

        <div
          className="form-actions"
          style={{
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            paddingTop: "1.5rem",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <button
            className="btn-primary"
            type="submit"
            disabled={saving}
            style={{ minWidth: "140px" }}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/conferences")}
            style={{ minWidth: "120px" }}
          >
            Quay lại
          </button>
        </div>
      </form>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
};

export default AdminConferenceEdit;
