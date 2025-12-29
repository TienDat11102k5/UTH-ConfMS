import AdminLayout from "../../components/Layout/AdminLayout";

const SmtpConfigPage = () => {
  // Thông tin cấu hình hiện tại (cứng trong application.properties)
  const config = {
    host: "smtp.gmail.com",
    port: 587,
    username: "datpham100705@gmail.com",
    fromEmail: "datpham100705@gmail.com",
    useTls: true,
    status: "Đang hoạt động"
  };

  return (
    <AdminLayout title="Cấu hình Email"
      subtitle="Xem thông tin cấu hình email hệ thống."
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Email / SMTP</span>
          </div>
          <h2 className="data-page-title" style={{ marginBottom: "0.25rem" }}>Thông tin Email</h2>
          <p className="data-page-subtitle" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Hệ thống sử dụng cấu hình email sau để gửi thông báo, reset mật khẩu, v.v.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "1200px" }}>
        {/* Card 1: Cấu hình SMTP */}
        <div className="form-card" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Cấu hình SMTP</h3>
            <span style={{
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 600,
              background: "#d1fae5",
              color: "#065f46"
            }}>
              {config.status}
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                SMTP Host
              </label>
              <div style={{
                padding: "0.4rem 0.6rem",
                background: "white",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                color: "#1f2937",
                fontFamily: "monospace",
                fontSize: "0.8rem"
              }}>
                {config.host}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                  Port
                </label>
                <div style={{
                  padding: "0.4rem 0.6rem",
                  background: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  color: "#1f2937",
                  fontFamily: "monospace",
                  fontSize: "0.8rem"
                }}>
                  {config.port}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                  Bảo mật
                </label>
                <div style={{
                  padding: "0.4rem 0.6rem",
                  background: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  color: "#1f2937",
                  fontSize: "0.8rem"
                }}>
                  {config.useTls ? "TLS/STARTTLS" : "Không"}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                Username / Email đăng nhập
              </label>
              <div style={{
                padding: "0.4rem 0.6rem",
                background: "white",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                color: "#1f2937",
                fontFamily: "monospace",
                fontSize: "0.8rem"
              }}>
                {config.username}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
                Email người gửi (From)
              </label>
              <div style={{
                padding: "0.4rem 0.6rem",
                background: "white",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                color: "#1f2937",
                fontFamily: "monospace",
                fontSize: "0.8rem"
              }}>
                {config.fromEmail}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: "0.75rem",
            padding: "0.5rem",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "4px",
            fontSize: "0.7rem",
            color: "#92400e",
            lineHeight: "1.3"
          }}>
            <strong> Lưu ý:</strong> Cấu hình trong <code style={{
              padding: "0.1rem 0.25rem",
              background: "#fef3c7",
              borderRadius: "3px",
              fontFamily: "monospace"
            }}>application.properties</code>. Cần restart server để thay đổi.
          </div>
        </div>

        {/* Card 2: Chức năng Email */}
        <div className="form-card" style={{ padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>Chức năng Email</h3>
          <ul style={{ 
            listStyle: "none", 
            padding: 0, 
            margin: 0,
            display: "grid",
            gap: "0.5rem"
          }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span>
              <span>Thông báo phân công review cho Reviewer</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span>
              <span>Thông báo review đã nộp cho Chair</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span>
              <span>Thông báo quyết định Accept/Reject cho Author</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span>
              <span>Nhắc nhở upload bản camera-ready</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span>
              <span>Reset mật khẩu</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SmtpConfigPage;
