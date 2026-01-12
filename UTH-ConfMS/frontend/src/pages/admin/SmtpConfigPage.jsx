// src/pages/admin/SmtpConfigPage.jsx
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/Layout/AdminLayout";

const SmtpConfigPage = () => {
  const { t } = useTranslation();
  
  const config = { host: "smtp.gmail.com", port: 587, username: "datpham100705@gmail.com", fromEmail: "datpham100705@gmail.com", useTls: true, status: t('admin.smtp.active') };

  return (
    <AdminLayout title={t('admin.smtp.title')}>
      <div className="data-page-header"><div className="data-page-header-left"><div className="breadcrumb"></div></div></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "1200px" }}>
        <div className="form-card" style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{t('admin.smtp.smtpConfig')}</h3>
            <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600, background: "#d1fae5", color: "#065f46" }}>{config.status}</span>
          </div>

          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>SMTP Host</label>
              <div style={{ padding: "0.4rem 0.6rem", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#1f2937", fontFamily: "monospace", fontSize: "0.8rem" }}>{config.host}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>Port</label>
                <div style={{ padding: "0.4rem 0.6rem", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#1f2937", fontFamily: "monospace", fontSize: "0.8rem" }}>{config.port}</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.smtp.security')}</label>
                <div style={{ padding: "0.4rem 0.6rem", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#1f2937", fontSize: "0.8rem" }}>{config.useTls ? "TLS/STARTTLS" : t('admin.smtp.none')}</div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.smtp.username')}</label>
              <div style={{ padding: "0.4rem 0.6rem", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#1f2937", fontFamily: "monospace", fontSize: "0.8rem" }}>{config.username}</div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>{t('admin.smtp.fromEmail')}</label>
              <div style={{ padding: "0.4rem 0.6rem", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", color: "#1f2937", fontFamily: "monospace", fontSize: "0.8rem" }}>{config.fromEmail}</div>
            </div>
          </div>

          <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", fontSize: "0.7rem", color: "#92400e", lineHeight: "1.3" }}>
            <strong>{t('admin.smtp.note')}:</strong> {t('admin.smtp.configNote')}
          </div>
        </div>

        <div className="form-card" style={{ padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>{t('admin.smtp.emailFeatures')}</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}><span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span><span>{t('admin.smtp.features.reviewerNotify')}</span></li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}><span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span><span>{t('admin.smtp.features.chairNotify')}</span></li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}><span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span><span>{t('admin.smtp.features.authorNotify')}</span></li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}><span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span><span>{t('admin.smtp.features.cameraReadyReminder')}</span></li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}><span style={{ color: "#10b981", fontSize: "0.95rem" }}>✓</span><span>{t('admin.smtp.features.passwordReset')}</span></li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SmtpConfigPage;
