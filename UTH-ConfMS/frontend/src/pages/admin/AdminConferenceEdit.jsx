import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

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
      <DashboardLayout title="Đang tải..." roleLabel="Admin">
        <div>Loading...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title={`Sửa Hội Nghị #${id}`}
      subtitle="Cập nhật thông tin chi tiết và danh sách tracks."
    >
      <form onSubmit={handleSave} style={{ maxWidth: 900 }}>
        {error && <div className="alert alert-danger mb-3">{error}</div>}

        {/* 1. Thông tin cơ bản */}
        <div className="card mb-4">
          <div className="card-header bg-light fw-bold">Thông tin chung</div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Tên hội nghị (*)</label>
              <input
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mô tả chi tiết (*)</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="blindReview"
                checked={formData.blindReview}
                onChange={handleChange}
                id="blindReviewCheck"
              />
              <label className="form-check-label" htmlFor="blindReviewCheck">
                Bật chế độ Blind Review (Phản biện kín)
              </label>
            </div>
          </div>
        </div>

        {/* 2. Thời gian */}
        <div className="card mb-4">
          <div className="card-header bg-light fw-bold">Thời gian tổ chức</div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Ngày bắt đầu (*)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ngày kết thúc (*)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label text-danger fw-bold">
                Hạn nộp bài (Submission Deadline)
              </label>
              <input
                type="datetime-local"
                className="form-control border-danger"
                name="submissionDeadline"
                value={formData.submissionDeadline}
                onChange={handleChange}
              />
              <small className="text-muted">
                Lưu ý: Hạn nộp phải trước ngày bắt đầu hội nghị.
              </small>
            </div>
          </div>
        </div>

        {/* 3. Tracks Management */}
        <div className="card mb-4">
          <div className="card-header bg-light fw-bold">
            Danh sách Tracks (Chủ đề)
          </div>
          <div className="card-body">
            {formData.tracks.map((track, index) => (
              <div key={index} className="d-flex gap-2 mb-2 align-items-center">
                <span className="text-muted" style={{ width: "30px" }}>
                  {index + 1}.
                </span>
                <input
                  className="form-control"
                  placeholder="Tên track (VD: AI, Software Engineering...)"
                  value={track.name}
                  onChange={(e) => handleTrackChange(index, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeTrack(index)}
                  title="Xóa track này"
                >
                  <i className="bi bi-trash"></i> X
                </button>
              </div>
            ))}
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={addTrack}
              >
                + Thêm Track mới
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 mb-5">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/conferences")}
          >
            Quay lại danh sách
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default AdminConferenceEdit;
