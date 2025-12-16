import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const AdminConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Quản lý Hội nghị"
      subtitle="Tạo và quản lý các hội nghị khoa học."
    >
      <div style={{ maxWidth: 1000 }}>
        {/* Nút mở Modal tạo mới */}
        <div style={{ marginBottom: 20 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Tạo Hội Nghị Mới
          </button>
        </div>

        {/* Danh sách Hội nghị */}
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th style={{ width: "50px" }}>ID</th>
                <th>Tên Hội nghị</th>
                <th>Thời gian diễn ra</th>
                <th>Hạn nộp bài</th>
                <th style={{ width: "200px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {conferences.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      {c.tracks && c.tracks.length > 0
                        ? `${c.tracks.length} tracks`
                        : "Chưa có track"}
                    </div>
                  </td>
                  <td>
                    {c.startDate
                      ? new Date(c.startDate).toLocaleDateString()
                      : "..."}
                    {" - "}
                    {c.endDate
                      ? new Date(c.endDate).toLocaleDateString()
                      : "..."}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="text-danger">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      "Không set"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info me-2"
                      onClick={() => navigate(`/conferences/${c.id}`)}
                    >
                      Chi tiết
                    </button>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() =>
                        navigate(`/admin/conferences/${c.id}/edit`)
                      }
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {conferences.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    Chưa có hội nghị nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* --- MODAL FORM TẠO MỚI (Overlay thủ công) --- */}
        {showModal && (
          <div className="modal-overlay" style={overlayStyle}>
            <div className="modal-content" style={modalStyle}>
              <h3>Tạo Hội Nghị Mới</h3>
              <form onSubmit={handleCreate}>
                {/* 1. Thông tin chung */}
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
                  <label className="form-label">Mô tả (*)</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* 2. Ngày tháng (Grid 2 cột) */}
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
                  <label className="form-label text-danger">
                    Hạn nộp bài (Phải trước ngày bắt đầu)
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    name="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={handleChange}
                  />
                </div>

                {/* 3. Tracks (Chủ đề) */}
                <div className="mb-3 border p-3 bg-light rounded">
                  <label className="form-label fw-bold">
                    Danh sách Tracks (Chủ đề)
                  </label>
                  {formData.tracks.map((track, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        placeholder={`Tên track ${
                          index + 1
                        } (VD: AI, Security...)`}
                        value={track.name}
                        onChange={(e) =>
                          handleTrackChange(index, e.target.value)
                        }
                      />
                      {formData.tracks.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeTrack(index)}
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={addTrack}
                  >
                    + Thêm Track
                  </button>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Đang xử lý..." : "Tạo Hội Nghị"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// CSS nội bộ cho Modal nhanh (Cậu có thể chuyển sang file CSS riêng)
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "700px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
};

export default AdminConferences;
