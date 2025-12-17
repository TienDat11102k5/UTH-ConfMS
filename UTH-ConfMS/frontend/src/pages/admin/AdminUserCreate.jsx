import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import apiClient from "../../apiClient";

const roles = ["ADMIN", "CHAIR", "REVIEWER", "AUTHOR"];

const AdminUserCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("AUTHOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return false;
    }
    // simple email check
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!re.test(email)) {
      setError("Email không hợp lệ.");
      return false;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      setLoading(true);
      // Use public register endpoint to create local account
      const res = await apiClient.post("/auth/register", {
        email: email.trim().toLowerCase(),
        password,
        fullName: name.trim(),
      });

      // If admin selected a role other than default, update via admin API
      const newUserId = res?.data?.user?.id;
      if (newUserId && role) {
        try {
          await apiClient.put(`/admin/users/${newUserId}/role`, { role });
        } catch (roleErr) {
          console.error("Failed to set role:", roleErr);
          // non-fatal: show warning but still navigate back
          alert("Tạo tài khoản thành công nhưng phân quyền thất bại.");
          navigate("/admin/users");
          return;
        }
      }

      alert("Tạo tài khoản thành công.");
      navigate("/admin/users");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Tạo tài khoản thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout roleLabel="Site Administrator" title="Tạo tài khoản mới" subtitle="Tạo tài khoản người dùng cho hệ thống">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/admin/users" className="breadcrumb-link">
              Người dùng
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tạo mới</span>
          </div>
          <h2 className="data-page-title">Tạo tài khoản</h2>
        </div>
      </div>

      {error && (
        <div className="form-card" style={{ border: "1px solid #ffd4d4", color: "#d72d2d" }}>
          {error}
        </div>
      )}

      <div className="form-card" style={{ maxWidth: 720 }}>
        <h3>Thông tin tài khoản</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Họ tên</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
            </div>
            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/admin/users")} disabled={loading}>
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AdminUserCreate;
