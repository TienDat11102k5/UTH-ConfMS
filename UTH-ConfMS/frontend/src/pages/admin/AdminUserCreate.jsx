import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/Layout/AdminLayout";
import apiClient from "../../apiClient";

const roles = ["ADMIN", "CHAIR", "REVIEWER", "AUTHOR"];

const AdminUserCreate = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState("AUTHOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Họ và tên không được để trống";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    if (!email || email.trim().length === 0) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Email không hợp lệ";
    }

    if (!password || password.length === 0) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!passwordConfirm || passwordConfirm.length === 0) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    if (!validateForm()) {
      setError("Vui lòng kiểm tra lại thông tin.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      // Use public register endpoint to create local account
      const res = await apiClient.post("/auth/register", payload, { skipAuth: true });

      // If admin selected a role other than default, update via admin API
      const newUserId = res?.data?.user?.id;
      const desiredRole = String(role || "AUTHOR").toUpperCase();
      if (newUserId && desiredRole && desiredRole !== "AUTHOR") {
        try {
          await apiClient.put(`/admin/users/${newUserId}/role`, { role: desiredRole });
          setSuccessMsg("Tạo tài khoản & phân quyền thành công! Đang quay lại danh sách...");
          setTimeout(() => navigate("/admin/users"), 900);
          return;
        } catch (roleErr) {
          console.error("Failed to set role:", roleErr);
          setSuccessMsg("Tạo tài khoản thành công!");
          setError("Tạo tài khoản thành công nhưng phân quyền thất bại. Bạn có thể phân quyền lại ở danh sách người dùng.");
          setTimeout(() => navigate("/admin/users"), 1200);
          return;
        }
      }

      setSuccessMsg("Tạo tài khoản thành công! Đang quay lại danh sách...");
      setTimeout(() => navigate("/admin/users"), 900);
    } catch (err) {
      console.error("Admin create user error:", err);

      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          const message = data?.message || data?.error || "Thông tin tạo tài khoản không hợp lệ";
          setError(message);
        } else if (status === 409) {
          setError("Email này đã tồn tại trong hệ thống.");
          setFieldErrors({ email: "Email đã tồn tại" });
        } else {
          setError(data?.message || "Tạo tài khoản thất bại. Vui lòng thử lại.");
        }
      } else if (err?.request) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo tài khoản"
      subtitle="Dùng lại API đăng ký để tạo tài khoản LOCAL, sau đó phân quyền theo lựa chọn."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/users" className="breadcrumb-link">
              Người dùng
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tạo tài khoản</span>
          </div>
          <h2 className="data-page-title">Tạo tài khoản mới</h2>
          <p className="data-page-subtitle">
            Sau khi tạo, bạn có thể dùng nút “Phân quyền” để đổi vai trò.
          </p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 720 }}>
        <h3>Thông tin tài khoản</h3>

        {successMsg && (
          <div className="auth-success" style={{ marginBottom: "0.75rem" }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: "0.75rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ tên</label>
            <input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Nguyễn Văn A"
              disabled={loading}
              className={fieldErrors.fullName ? "error" : ""}
            />
            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                disabled={loading}
                className={fieldErrors.email ? "error" : ""}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                Nếu chọn khác AUTHOR, hệ thống sẽ gọi API admin để phân quyền sau khi tạo.
              </small>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                disabled={loading}
                className={fieldErrors.password ? "error" : ""}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (fieldErrors.passwordConfirm) {
                    setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                  }
                }}
                placeholder="••••••••"
                disabled={loading}
                className={fieldErrors.passwordConfirm ? "error" : ""}
              />
              {fieldErrors.passwordConfirm && (
                <span className="field-error">{fieldErrors.passwordConfirm}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin/users")}
              disabled={loading}
            >
              Quay lại danh sách
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminUserCreate;
