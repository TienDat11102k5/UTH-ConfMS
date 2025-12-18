// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, setCurrentUser } from "../auth";
import apiClient from "../apiClient";
import "../styles/UserProfilePage.css";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [currentUserState, setCurrentUserState] = useState(getCurrentUser()); // Thêm state cho currentUser
  const [loading, setLoading] = useState(false); // loading khi submit
  const [fetchingProfile, setFetchingProfile] = useState(false); // loading khi đồng bộ profile
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    affiliation: "",
    gender: "",
    address: "",
    bio: "",
  });
  const [originalFormData, setOriginalFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!currentUserState) {
      navigate("/login");
      return;
    }
    // Khởi tạo form với dữ liệu user hiện tại (local)
    const userData = {
      fullName: currentUserState.fullName || currentUserState.name || "",
      dateOfBirth: currentUserState.dateOfBirth || "",
      email: currentUserState.email || "",
      phone: currentUserState.phone || "",
      affiliation: currentUserState.affiliation || "",
      gender: currentUserState.gender || "",
      address: currentUserState.address || "",
      bio: currentUserState.bio || "",
    };

    setFormData(userData);
    setOriginalFormData(userData);
    setAvatarPreview(
      currentUserState.photoURL ||
        currentUserState.avatarUrl ||
        currentUserState.avatar
    );

    // Đồng bộ lại dữ liệu mới nhất từ backend để tránh mất dữ liệu sau reload
    const loadProfile = async () => {
      try {
        setFetchingProfile(true);
        const res = await apiClient.get("/user/profile");
        if (!res?.data) return;
        const refreshed = {
          fullName: res.data.fullName || res.data.name || "",
          dateOfBirth: res.data.dateOfBirth || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          affiliation: res.data.affiliation || "",
          gender: res.data.gender || "",
          address: res.data.address || "",
          bio: res.data.bio || "",
          avatar: res.data.avatarUrl || res.data.avatar || res.data.photoURL,
        };
        setFormData((prev) => ({ ...prev, ...refreshed }));
        setOriginalFormData(refreshed);
        setAvatarPreview(
          refreshed.avatar ||
            currentUserState.photoURL ||
            currentUserState.avatarUrl ||
            currentUserState.avatar
        );
        // Lưu lại localStorage để lần vào sau vẫn có dữ liệu
        const updatedUser = { ...currentUserState, ...res.data };
        setCurrentUser(updatedUser, { remember: true });
        setCurrentUserState(updatedUser);
      } catch (err) {
        console.error("Không tải được profile mới nhất:", err);
      } finally {
        setFetchingProfile(false);
      }
    };

    loadProfile();
  }, [navigate]); // chỉ chạy khi mount hoặc navigate đổi (tránh loop)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Chỉ cho phép nhập số và tối đa 10 ký tự
    const phoneRegex = /^[0-9]*$/;
    if (phoneRegex.test(value) && value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Kiểm tra file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }
    // Kiểm tra file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }
    setUploadingAvatar(true);
    setError("");
    try {
      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Upload lên server
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await apiClient.post("/user/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Cập nhật user trong localStorage và state
      const updatedUser = { ...currentUserState, ...res.data };
      setCurrentUser(updatedUser, { remember: true });
      setCurrentUserState(updatedUser); // Update state để re-render đúng
      setSuccess("Cập nhật avatar thành công!");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Không thể upload avatar. Vui lòng thử lại."
      );
      // Rollback preview
      setAvatarPreview(
        currentUserState.photoURL ||
          currentUserState.avatarUrl ||
          currentUserState.avatar
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditClick = () => {
    console.log("handleEditClick called - isEditing before:", isEditing);
    setIsEditing(true);
    console.log("handleEditClick - setting isEditing to true");
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    console.log("handleCancelEdit called - isEditing before:", isEditing);
    setIsEditing(false);
    setFormData(originalFormData);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Tạo payload mới (KHÔNG gửi field rỗng)
      const payload = { ...formData };

      if (!payload.phone || payload.phone.trim() === "") {
        delete payload.phone;
      }

      if (!payload.dateOfBirth) {
        delete payload.dateOfBirth;
      }

      console.log("Payload gửi lên:", payload);

      const res = await apiClient.put("/user/profile", payload);

      const updatedUser = { ...currentUserState, ...res.data };
      setCurrentUser(updatedUser, { remember: true });
      setCurrentUserState(updatedUser);

      setOriginalFormData(payload);
      setIsEditing(false);
      setSuccess("Cập nhật thông tin thành công!");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Profile update error:", err);

      let errorMessage = "Không thể cập nhật thông tin. Vui lòng thử lại.";
      if (err?.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserState) {
    return null;
  }

  // console.log("Rendering - isEditing:", isEditing); // Comment để tránh spam console

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {fetchingProfile && (
          <div className="alert profile-alert-loading">
            Đang tải thông tin mới nhất...
          </div>
        )}
        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="profile-avatar-large"
                />
              ) : (
                <div className="profile-avatar-placeholder-large">
                  {getInitials(formData.fullName)}
                </div>
              )}
              {uploadingAvatar && (
                <div className="avatar-uploading">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <label className="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="visually-hidden"
                />
                {uploadingAvatar ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
              </label>
              <p className="avatar-hint">JPG, PNG, GIF (tối đa 5MB)</p>
            </div>
          </div>
          {/* Profile Form */}
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="profile-section-header">
                <h2>Thông tin cơ bản</h2>
                {!isEditing && (
                  <button
                    type="button"
                    className="btn-primary profile-edit-btn"
                    onClick={handleEditClick}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Họ và tên *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Ngày tháng năm sinh</label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="^0[0-9]{9}$"
                    value={formData.phone || ""}
                    onChange={handlePhoneChange}
                    placeholder="0xxxxxxxxx (10 số, bắt đầu bằng 0)"
                    disabled={!isEditing}
                    maxLength="10"
                    title="Số điện thoại phải có 10 số và bắt đầu bằng số 0"
                  />
                  {isEditing && formData.phone && formData.phone.length > 0 && (
                    <small
                      style={{
                        color:
                          formData.phone.length === 10 &&
                          formData.phone.startsWith("0")
                            ? "#16a34a"
                            : "#dc2626",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {!formData.phone.startsWith("0")
                        ? "⚠️ Phải bắt đầu bằng số 0"
                        : formData.phone.length < 10
                        ? `⚠️ Còn ${10 - formData.phone.length} số nữa`
                        : "✓ Hợp lệ"}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Giới tính</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={
                      isEditing
                        ? {
                            backgroundColor: "white",
                            cursor: "pointer",
                            opacity: 1,
                          }
                        : {}
                    }
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                  title="Email không thể thay đổi"
                />
              </div>
              <div className="form-group">
                <label htmlFor="affiliation">Cơ quan/Tổ chức</label>
                <input
                  id="affiliation"
                  name="affiliation"
                  type="text"
                  value={formData.affiliation || ""}
                  onChange={handleChange}
                  placeholder="Trường Đại học, Công ty..."
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Địa chỉ</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Địa chỉ liên hệ"
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="bio">Giới thiệu bản thân</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  placeholder="Viết vài dòng về bản thân, lĩnh vực nghiên cứu..."
                  disabled={!isEditing}
                  style={
                    isEditing
                      ? { backgroundColor: "white", cursor: "text", opacity: 1 }
                      : {}
                  }
                />
              </div>
            </div>
            {isEditing && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </form>
          {/* Account Info */}
          <div className="account-info-section">
            <h2>Thông tin tài khoản</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Vai trò:</span>
                <span className="info-value">
                  {currentUserState.role?.replace("ROLE_", "") || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className="info-value status-active">Hoạt động</span>
              </div>
              {currentUserState.createdAt && (
                <div className="info-item">
                  <span className="info-label">Ngày tạo:</span>
                  <span className="info-value">
                    {new Date(currentUserState.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
