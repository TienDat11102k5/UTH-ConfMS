// src/pages/chair/ChairConferenceManager.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import "../../styles/ChairConferenceManager.css";
import { usePagination } from "../../hooks/usePagination";
import {
  FiFileText,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiLock,
} from "react-icons/fi";

const ChairConferenceManager = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    usePagination(conferences, 20);

  const [showModal, setShowModal] = useState(false);
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
    tracks: [{ name: "" }],
  });

  const navigate = useNavigate();

  const fetchConfs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/conferences");
      setConferences(res.data || []);
    } catch {
      setError("Không thể tải danh sách hội nghị.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTrackChange = (index, value) => {
    const tracks = [...formData.tracks];
    tracks[index].name = value;
    setFormData({ ...formData, tracks });
  };

  const addTrack = () => {
    setFormData({ ...formData, tracks: [...formData.tracks, { name: "" }] });
  };

  const removeTrack = (index) => {
    setFormData({
      ...formData,
      tracks: formData.tracks.filter((_, i) => i !== index),
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    const payload = {
      ...formData,
      tracks: formData.tracks.filter((t) => t.name.trim() !== ""),
    };

    try {
      setSubmitting(true);
      const res = await apiClient.post("/conferences", payload);
      setConferences([res.data, ...conferences]);
      setShowModal(false);
      resetForm();
      alert("Tạo hội nghị thành công!");
    } catch (err) {
      alert("Lỗi: " + (err.response?.data || "Tạo thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("CẢNH BÁO: Chỉ xóa được hội nghị chưa có bài nộp.")) return;
    try {
      await apiClient.delete(`/conferences/${id}`);
      setConferences((s) => s.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.response?.data || "Xoá thất bại.");
    }
  };

  const handleToggleHidden = async (id, current) => {
    if (!confirm(`Bạn có chắc muốn ${current ? "hiện" : "ẩn"} hội nghị?`))
      return;
    try {
      const res = await apiClient.put(`/conferences/${id}/toggle-hidden`);
      setConferences((p) => p.map((c) => (c.id === id ? res.data : c)));
    } catch {
      alert("Không thể thay đổi trạng thái.");
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
      roleLabel="Program / Track Chair"
      title="Quản lý Hội nghị"
      subtitle="Tạo và quản lý các hội nghị khoa học."
    >
      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên hội nghị</th>
              <th>Thời gian</th>
              <th>Hạn nộp bài</th>
              <th>Camera-ready</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : (
              paginatedItems.map((c) => (
                <tr key={c.id} className={c.isHidden ? "row-hidden" : ""}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="track-info">
                      {c.tracks?.length
                        ? `${c.tracks.length} track`
                        : "Chưa có track"}
                    </div>
                  </td>
                  <td>
                    {new Date(c.startDate).toLocaleDateString()} -{" "}
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td>
                    {c.submissionDeadline ? (
                      <span className="badge-soft">
                        {new Date(c.submissionDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted">Chưa đặt</span>
                    )}
                  </td>
                  <td>
                    {c.cameraReadyDeadline ? (
                      <span className="badge-warning">
                        {new Date(c.cameraReadyDeadline).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted">Chưa đặt</span>
                    )}
                  </td>
                  <td className="status-cell">
                    {c.isHidden ? (
                      <span className="badge-danger">Đã ẩn</span>
                    ) : (
                      <span className="badge-success">Hiển thị</span>
                    )}
                    {c.isLocked && <FiLock className="lock-icon" />}
                  </td>
                  <td>
                    <div className="action-icons">
                      <button onClick={() => navigate(`/chair/conferences/${c.id}/submissions`)}>
                        <FiFileText />
                      </button>
                      <button
                        disabled={c.isLocked}
                        onClick={() => navigate(`/chair/conferences/${c.id}/edit`)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        disabled={c.isLocked}
                        onClick={() => handleToggleHidden(c.id, c.isHidden)}
                      >
                        {c.isHidden ? <FiEye /> : <FiEyeOff />}
                      </button>
                      <button
                        disabled={c.isLocked}
                        onClick={() => handleDelete(c.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Tạo hội nghị mới</h3>
            <form onSubmit={handleCreate}>
              {/* giữ nguyên form */}
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChairConferenceManager;
