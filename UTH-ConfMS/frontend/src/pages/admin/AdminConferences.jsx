import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import AdminLayout from "../../components/Layout/AdminLayout";
import Pagination from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';

const AdminConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems} =
    usePagination(conferences, 20);

  // State cho Modal tạo mới
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Data khớp với Entity Backend
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    reviewDeadline: "",
    cameraReadyDeadline: "",
    blindReview: true,
    tracks: [{ name: "" }], // Mặc định có 1 track rỗng
  });

  const navigate = useNavigate();

  // --- 1. Lấy dữ liệu ---
  const fetchConfs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách hội nghị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfs();
  }, []);

  // --- 2. Xử lý Input Form ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- 3. Xử lý Dynamic Tracks (Thêm/Sửa/Xóa Track) ---
  const handleTrackChange = (index, value) => {
    const newTracks = [...formData.tracks];
    newTracks[index].name = value;
    setFormData({ ...formData, tracks: newTracks });
  };

  const addTrack = () => {
    setFormData({ ...formData, tracks: [...formData.tracks, { name: "" }] });
  };

  const removeTrack = (index) => {
    const newTracks = formData.tracks.filter((_, i) => i !== index);
    setFormData({ ...formData, tracks: newTracks });
  };

  // --- 4. Gửi API Tạo mới ---
  const handleCreate = async (e) => {
    e.preventDefault();

    // Validate cơ bản phía Client
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Vui lòng điền tên, ngày bắt đầu và ngày kết thúc!");
      return;
    }

    // Lọc bỏ các track rỗng trước khi gửi
    const cleanTracks = formData.tracks.filter((t) => t.name.trim() !== "");

    const payload = {
      ...formData,
      tracks: cleanTracks,
    };

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/conferences`, payload);
      setConferences([res.data, ...conferences]); // Thêm vào list hiển thị
      setShowModal(false); // Đóng modal
      resetForm();
      alert("Tạo hội nghị thành công!");
    } catch (err) {
      console.error(err);
      // Hiển thị lỗi từ Backend trả về (ví dụ: Ngày nộp bài phải trước ngày bắt đầu)
      const serverMsg = err.response?.data || "Tạo thất bại";
      alert("Lỗi: " + serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "CẢNH BÁO: Xoá hội nghị sẽ xoá toàn bộ bài báo liên quan.\nXác nhận xoá?"
      )
    )
      return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại. Có thể do ràng buộc dữ liệu.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      submissionDeadline: "",
      reviewDeadline: "",
      cameraReadyDeadline: "",
      blindReview: true,
      tracks: [{ name: "" }],
    });
  };

  return (
    <AdminLayout title="Quản lý Hội nghị"
      subtitle="Tạo và quản lý các hội nghị khoa học."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Hội nghị</span>
          </div>
          <h2 className="data-page-title">Danh sách hội nghị</h2>
          <p className="data-page-subtitle">
            Tạo mới, chỉnh sửa và theo dõi tất cả hội nghị đang quản lý trên hệ thống.
          </p>
        </div>

        <div className="data-page-header-right">
          <button className="btn-secondary" type="button" onClick={fetchConfs}>
            Làm mới
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Tạo hội nghị
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>ID</th>
              <th>Tên Hội nghị</th>
              <th>Thời gian diễn ra</th>
              <th>Hạn nộp bài</th>
              <th style={{ width: "220px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="table-empty" style={{ color: "#d72d2d" }}>
                  {error}
                </td>
              </tr>
            ) : conferences.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Chưa có hội nghị nào. Nhấn{" "}
                  <button
                    type="button"
                    className="link-inline"
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    “Tạo hội nghị”
                  </button>{" "}
                  để thêm mới.
                </td>
              </tr>
            ) : (
              paginatedItems.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {c.tracks && c.tracks.length > 0
                        ? `${c.tracks.length} track${c.tracks.length > 1 ? "s" : ""}`
                        : "Chưa có track"}
                    </div>
                  </td>
                  <td>
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "..."} -{" "}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)" }}>Chưa đặt</span>
                    )}
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn-secondary table-action"
                        type="button"
                        onClick={() => navigate(`/conferences/${c.id}`)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="btn-primary table-action"
                        type="button"
                        onClick={() => navigate(`/admin/conferences/${c.id}/edit`)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-secondary table-action"
                        type="button"
                        style={{ color: "#d72d2d" }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && conferences.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={conferences.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="hội nghị"
        />
      )}

      {/* --- MODAL FORM TẠO MỚI --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Tạo Hội Nghị Mới</h3>
            <form onSubmit={handleCreate} className="submission-form">
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
                <label className="form-label">Mô tả *</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="textarea-input"
                  placeholder="Giới thiệu ngắn gọn về hội nghị..."
                />
              </div>

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
                <label className="form-label text-danger">
                  Hạn nộp bài (Phải trước ngày bắt đầu)
                </label>
                <input
                  type="datetime-local"
                  name="submissionDeadline"
                  value={formData.submissionDeadline}
                  onChange={handleChange}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Hạn chấm bài (Review deadline)</label>
                  <input
                    type="datetime-local"
                    name="reviewDeadline"
                    value={formData.reviewDeadline}
                    onChange={handleChange}
                    placeholder="Thời hạn reviewer chấm bài"
                  />
                  <div className="field-hint">Thời hạn để reviewer hoàn thành đánh giá</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Hạn nộp bản cuối (Camera-ready deadline)</label>
                  <input
                    type="datetime-local"
                    name="cameraReadyDeadline"
                    value={formData.cameraReadyDeadline}
                    onChange={handleChange}
                    placeholder="Thời hạn nộp bản cuối"
                  />
                  <div className="field-hint">Thời hạn tác giả nộp bản cuối sau khi được chấp nhận</div>
                </div>
              </div>

              <div className="form-card" style={{ padding: "1rem" }}>
                <label className="form-label">Danh sách Tracks (Chủ đề)</label>
                {formData.tracks.map((track, index) => (
                  <div key={index} className="inline-actions" style={{ width: "100%" }}>
                    <input
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder={`Tên track ${index + 1} (VD: AI, Security...)`}
                      value={track.name}
                      onChange={(e) => handleTrackChange(index, e.target.value)}
                    />
                    {formData.tracks.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary table-action"
                        style={{ color: "#d72d2d" }}
                        onClick={() => removeTrack(index)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary table-action" onClick={addTrack}>
                  + Thêm Track
                </button>
              </div>

              <label className="checkbox" style={{ marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  name="blindReview"
                  checked={formData.blindReview}
                  onChange={handleChange}
                />
                Bật chế độ Blind Review
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Tạo Hội Nghị"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminConferences;