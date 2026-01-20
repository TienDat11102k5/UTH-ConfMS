// src/pages/chair/ChairCOIDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import { FiAlertTriangle, FiUser, FiFileText, FiCalendar, FiMessageSquare } from "react-icons/fi";

const ChairCOIDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [conflict, setConflict] = useState(null);
  const [conference, setConference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConflictDetail();
  }, [id]);

  const loadConflictDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get(`/conflicts/${id}`);
      setConflict(res.data);
      
      // Load conference info if track has conferenceId
      if (res.data?.paper?.track?.conferenceId) {
        try {
          const confRes = await apiClient.get(`/conferences/${res.data.paper.track.conferenceId}`);
          setConference(confRes.data);
        } catch (err) {
          console.error("Load conference error:", err);
        }
      }
    } catch (err) {
      console.error("Load conflict detail error:", err);
      setError(t('chair.coi.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const locale = t('app.title') === 'Conference Management System' ? 'en-US' : 'vi-VN';
    return new Date(dateString).toLocaleString(locale);
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.coi.detailTitle')}>
        <TableSkeleton rows={8} columns={2} />
      </DashboardLayout>
    );
  }

  if (error || !conflict) {
    return (
      <DashboardLayout roleLabel="Chair" title={t('chair.coi.detailTitle')}>
        <div style={{
          background: "#fee",
          border: "1px solid #f5c6cb",
          padding: "1rem",
          borderRadius: "8px",
          color: "#721c24"
        }}>
          {error || t('chair.coi.notFound')}
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/chair/coi")}
          style={{ marginTop: "1rem" }}
        >
          {t('chair.coi.backToList')}
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Chair"
      title={t('chair.coi.detailTitle')}
      subtitle={`${t('chair.coi.detailSubtitle')} #${id}`}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate("/chair")} style={{ cursor: "pointer" }}>Chair</span>
            <span className="breadcrumb-separator">/</span>
            <span onClick={() => navigate("/chair/coi")} style={{ cursor: "pointer" }}>{t('chair.coi.title')}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{t('app.details')} #{id}</span>
          </div>
          <h2 className="data-page-title">
            <FiAlertTriangle style={{ marginRight: "0.5rem", verticalAlign: "middle", color: "#f59e0b" }} />
            {t('chair.coi.detailTitle')} #{id}
          </h2>
        </div>

        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => navigate("/chair/coi")}
          >
            {t('chair.coi.backToList')}
          </button>
        </div>
      </div>

      {/* Conflict Info Card */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        marginBottom: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid #f1f5f9"
        }}>
          <FiAlertTriangle size={24} color="#f59e0b" />
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
            {t('chair.coi.conflictInfo')}
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Left Column */}
          <div>
            {/* Reviewer Info */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <FiUser size={18} color="#3b82f6" />
                <h4 style={{ margin: 0, fontSize: "1rem", color: "#475569" }}>
                  {t('chair.coi.reviewerInfo')}
                </h4>
              </div>
              <div style={{
                background: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.fullName')}:</strong>
                  <div style={{ fontSize: "1rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conflict.reviewer?.fullName || "N/A"}
                  </div>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.email')}:</strong>
                  <div style={{ fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conflict.reviewer?.email || "N/A"}
                  </div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.reviewerAffiliation')}:</strong>
                  <div style={{ fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conflict.reviewer?.affiliation || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Date Info */}
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <FiCalendar size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: "1rem", color: "#475569" }}>
                  {t('chair.coi.declaredTime')}
                </h4>
              </div>
              <div style={{
                background: "#f0fdf4",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #bbf7d0"
              }}>
                <div style={{ fontSize: "1rem", color: "#166534" }}>
                  {formatDate(conflict.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Paper Info */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <FiFileText size={18} color="#8b5cf6" />
                <h4 style={{ margin: 0, fontSize: "1rem", color: "#475569" }}>
                  {t('chair.coi.paperInfo')}
                </h4>
              </div>
              <div style={{
                background: "#faf5ff",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #e9d5ff"
              }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.paperTitle')}:</strong>
                  <div style={{ fontSize: "1rem", color: "#1e293b", marginTop: "0.25rem", lineHeight: "1.5" }}>
                    {conflict.paper?.title || "N/A"}
                  </div>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.conference')}:</strong>
                  <div style={{ fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conference?.name || "N/A"}
                  </div>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.paperTrack')}:</strong>
                  <div style={{ fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conflict.paper?.track?.name || "—"}
                  </div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.875rem" }}>{t('chair.coi.paperAuthor')}:</strong>
                  <div style={{ fontSize: "0.95rem", color: "#1e293b", marginTop: "0.25rem" }}>
                    {conflict.paper?.author?.fullName || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Card */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem"
        }}>
          <FiMessageSquare size={20} color="#f59e0b" />
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b" }}>
            {t('chair.coi.conflictReason')}
          </h3>
        </div>
        <div style={{
          background: "#fffbeb",
          padding: "1.25rem",
          borderRadius: "8px",
          border: "1px solid #fde68a",
          fontSize: "1rem",
          color: "#78350f",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap"
        }}>
          {conflict.reason || t('chair.coi.noReason')}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChairCOIDetail;
