import { useState } from "react";
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

      const res = await apiClient.post("/auth/register", payload, { skipAuth: true });

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
    <AdminLayout title="TẠO TÀI KHOẢN MỚI">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">         
          </div>
        </div>
      </div>

      <div className="form-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Thông tin tài khoản</h3>

        {successMsg && (
          <div className="auth-success" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: "0.6rem", padding: '0.6rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Họ tên</label>
              <input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Nguyễn Văn A"
                disabled={loading}
                className={fieldErrors.fullName ? "error" : ""}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
              />
              {fieldErrors.fullName && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.fullName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Email</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                disabled={loading}
                className={fieldErrors.email ? "error" : ""}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
              />
              {fieldErrors.email && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.email}</span>}
            </div>
          </div>

          <div className="form-grid" style={{ gap: '0.75rem', marginTop: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Mật khẩu</label>
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
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
              />
              {fieldErrors.password && <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Xác nhận mật khẩu</label>
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
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
              />
              {fieldErrors.passwordConfirm && (
                <span className="field-error" style={{ fontSize: '0.8rem' }}>{fieldErrors.passwordConfirm}</span>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', width: '100%' }}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <small className="form-hint" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Nếu chọn khác AUTHOR, hệ thống sẽ gọi API admin để phân quyền sau khi tạo.
            </small>
          </div>

          <div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/admin/users")}
              disabled={loading}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
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
