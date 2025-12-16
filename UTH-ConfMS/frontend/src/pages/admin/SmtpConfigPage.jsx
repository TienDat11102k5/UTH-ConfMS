import React, { useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const SmtpConfigPage = () => {
  const [form, setForm] = useState({
    host: "smtp.example.com",
    port: 587,
    username: "noreply@example.com",
    password: "",
    fromEmail: "noreply@example.com",
    useTls: true,
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert("Giả lập lưu cấu hình SMTP. Sau này nối API để lưu thật.");
  };

  return (
    <DashboardLayout
      roleLabel="Site Administrator"
      title="Cấu hình SMTP"
      subtitle="Thiết lập máy chủ gửi mail, tài khoản và bảo mật TLS."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">SMTP / Email</span>
          </div>
          <h2 className="data-page-title">Máy chủ gửi mail</h2>
          <p className="data-page-subtitle">
            Dùng thông tin dưới đây để hệ thống gửi email thông báo, reset mật khẩu, v.v.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="submission-form" style={{ maxWidth: 720 }}>
        <div className="form-card">
          <h3>Máy chủ &amp; chứng thực</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input name="host" value={form.host} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input
                name="port"
                type="number"
                min={1}
                value={form.port}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input name="username" value={form.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••"
              />
            </div>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              name="useTls"
              checked={form.useTls}
              onChange={handleChange}
            />
            Bật TLS (STARTTLS/SSL)
          </label>
        </div>

        <div className="form-card">
          <h3>Thông tin người gửi</h3>
          <div className="form-group">
            <label className="form-label">From Email</label>
            <input name="fromEmail" value={form.fromEmail} onChange={handleChange} required />
            <div className="field-hint">
              Ví dụ: noreply@your-domain.com. Nên trùng domain để tránh spam.
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Lưu cấu hình
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => alert("Giả lập gửi email test")}
          >
            Gửi email test
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default SmtpConfigPage;

