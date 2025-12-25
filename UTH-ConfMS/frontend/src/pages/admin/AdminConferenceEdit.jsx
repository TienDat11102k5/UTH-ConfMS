import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";

const AdminConferenceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // State chứa dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    blindReview: true,
    tracks: [],
  });

  // Hàm helper: Chuyển đổi định dạng ngày từ Server (ISO) sang Input (yyyy-MM-ddThh:mm)
  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return "";
    // Cắt bỏ phần giây và timezone để vừa với input datetime-local
    // Ví dụ: 2025-12-20T08:00:00.000+00:00 -> 2025-12-20T08:00
    return new Date(isoString).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchConf = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/conferences/${id}`);
        const data = res.data;

        // Map dữ liệu từ API vào Form State
        setFormData({
          name: data.name || "",
          description: data.description || "",
          // Format lại ngày tháng để hiển thị đúng trên input
          startDate: formatDateTimeForInput(data.startDate),
          endDate: formatDateTimeForInput(data.endDate),
          submissionDeadline: formatDateTimeForInput(data.submissionDeadline),
          blindReview: data.blindReview !== undefined ? data.blindReview : true,
          tracks: data.tracks || [], // Đảm bảo tracks luôn là mảng
        });
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu hội nghị. Có thể ID không tồn tại.");
      } finally {
        setLoading(false);
      }
    };
    fetchConf();
  }, [id]);

  // Xử lý thay đổi input thường
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- QUẢN LÝ TRACKS (Thêm/Sửa/Xóa) ---
  const handleTrackChange = (index, value) => {
    const newTracks = [...formData.tracks];
    // Giữ nguyên ID nếu là track cũ, chỉ sửa tên
    newTracks[index] = { ...newTracks[index], name: value };
    setFormData({ ...formData, tracks: newTracks });
  };

  const addTrack = () => {
    // Track mới chưa có ID
    setFormData({ ...formData, tracks: [...formData.tracks, { name: "" }] });
  };

  const removeTrack = (index) => {
    // Nếu track đã có ID (đã lưu trong DB), việc xóa ở đây khi submit
    // sẽ phụ thuộc vào logic backend (orphanRemoval) để xóa hẳn khỏi DB.
    const newTracks = formData.tracks.filter((_, i) => i !== index);
    setFormData({ ...formData, tracks: newTracks });
  };

  // --- LƯU DỮ LIỆU ---
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    // Validate nhanh
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    try {
      setSaving(true);
      // Lọc bỏ track rỗng
      const cleanTracks = formData.tracks.filter(
        (t) => t.name && t.name.trim() !== ""
      );

      const payload = {
        ...formData,
        tracks: cleanTracks,
      };

      await apiClient.put(`/conferences/${id}`, payload);
      alert("Cập nhật thành công!");
      navigate("/admin/conferences");
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
    <AdminLayout title={`Sửa Hội Nghị #${id}`}
      subtitle="Cập nhật thông tin chi tiết và danh sách tracks."
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
          <p className="data-page-subtitle">
            Điều chỉnh nội dung, thời gian tổ chức và danh sách tracks cho hội nghị.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="submission-form" style={{ maxWidth: 960 }}>
        {error && (
          <div className="form-card" style={{ border: "1px solid #ffd4d4", color: "#d72d2d" }}>
            {error}
          </div>
        )}

        <div className="form-card">
          <h3>Thông tin chung</h3>
          <div className="form-group">
            <label className="form-label">Tên hội nghị *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ví dụ: UTH Conference 2025"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả chi tiết *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              required
              className="textarea-input"
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              name="blindReview"
              checked={formData.blindReview}
              onChange={handleChange}
            />
            Bật chế độ Blind Review (Phản biện kín)
          </label>
        </div>

        <div className="form-card">
          <h3>Thời gian tổ chức</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày kết thúc *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hạn nộp bài (Submission Deadline)</label>
            <input
              type="datetime-local"
              name="submissionDeadline"
              value={formData.submissionDeadline}
              onChange={handleChange}
            />
            <div className="field-hint">Lưu ý: Hạn nộp phải trước ngày bắt đầu hội nghị.</div>
          </div>
        </div>

        <div className="form-card">
          <h3>Danh sách Tracks (Chủ đề)</h3>
          {formData.tracks.map((track, index) => (
            <div key={index} className="inline-actions" style={{ marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-light)", width: 32 }}>{index + 1}.</span>
              <input
                style={{ flex: 1, minWidth: 0 }}
                placeholder="Tên track (VD: AI, Software Engineering...)"
                value={track.name}
                onChange={(e) => handleTrackChange(index, e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary table-action"
                style={{ color: "#d72d2d" }}
                onClick={() => removeTrack(index)}
                title="Xóa track này"
              >
                Xóa
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary table-action" onClick={addTrack}>
            + Thêm Track mới
          </button>
        </div>

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/conferences")}
          >
            Quay lại danh sách
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminConferenceEdit;