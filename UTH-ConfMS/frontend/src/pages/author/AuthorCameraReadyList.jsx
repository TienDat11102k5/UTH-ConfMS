// src/pages/author/AuthorCameraReadyList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import apiClient from "../../apiClient";
import "../../styles/AuthorPages.css";

const AuthorCameraReadyList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get(
          "/submissions?mine=true&status=ACCEPTED"
        );
        const raw = Array.isArray(res.data) ? res.data : [];

        const accepted = raw.filter((s) => {
          const status = (s.status || s.reviewStatus || "")
            .toString()
            .toLowerCase();
          const decision = (s.decision?.decision || "")
            .toString()
            .toLowerCase();
          const isAccepted =
            status === "accepted" ||
            status === "accept" ||
            status.includes("accept") ||
            decision === "accepted" ||
            decision === "accept";
          const isWithdrawn =
            (s.status || "").toString().toLowerCase() === "withdrawn" ||
            (s.reviewStatus || "").toString().toLowerCase() === "withdrawn";
          return isAccepted && !isWithdrawn;
        });

        if (!ignore) setSubmissions(accepted);
      } catch (err) {
        if (!ignore) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            navigate("/login");
            return;
          }
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Không thể tải danh sách submission."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <DashboardLayout roleLabel="Author" title="Quản lý Camera-ready">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">
              Portal
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/author/dashboard" className="breadcrumb-link">
              Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Camera-ready</span>
          </div>
          <h2 className="data-page-title">Quản lý Camera-ready</h2>
          <p className="data-page-subtitle">
            Danh sách các bài báo được chấp nhận. Tải lên bản camera-ready
            cho từng submission trước deadline.
          </p>
        </div>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
          Đang tải danh sách...
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>Chưa có bài báo được chấp nhận</h3>
          <p>
            Khi có bài báo được chấp nhận, bạn sẽ thấy danh sách ở đây để tải
            lên bản camera-ready.
          </p>
          <Link to="/author/submissions" className="btn-primary">
            Xem danh sách bài nộp
          </Link>
        </div>
      ) : (
        <div className="camera-ready-grid">
          {submissions.map((s) => {
            const hasCameraReady = s.cameraReadyPath || s.cameraReadyDownloadUrl;
            
            return (
              <div key={s.id} className="camera-ready-card">
                <div className="camera-ready-header">
                  <span className="submission-id">#{s.id}</span>
                  <span className="status-badge accepted">Đã chấp nhận</span>
                </div>

                <h3 className="camera-ready-title">{s.title}</h3>

                <div className="camera-ready-meta">
                  <div className="meta-row">
                    <span className="meta-label">HỘI NGHỊ:</span>
                    <span className="meta-value">
                      {s.conferenceName || s.conferenceId || "-"}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">CHỦ ĐỀ:</span>
                    <span className="meta-value">
                      {s.trackName || s.trackCode || s.trackId || "-"}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">NGÀY CHẤP NHẬN:</span>
                    <span className="meta-value">
                      {formatDate(s.updatedAt)}
                    </span>
                  </div>
                  {hasCameraReady && (
                    <div className="meta-row">
                      <span className="meta-label">CAMERA-READY:</span>
                      <span className="meta-value camera-ready-status">
                        ✓ Đã nộp
                      </span>
                    </div>
                  )}
                </div>

                <div className="camera-ready-actions">
                  <Link
                    to={`/author/submissions/${s.id}`}
                    className="btn-secondary btn-sm"
                  >
                    Chi tiết
                  </Link>
                  {!hasCameraReady ? (
                    <Link
                      to={`/author/submissions/${s.id}/camera-ready`}
                      className="btn-primary btn-sm"
                    >
                      Upload Camera-Ready
                    </Link>
                  ) : (
                    <>
                      <a
                        href={
                          s.cameraReadyDownloadUrl ||
                          (s.cameraReadyPath
                            ? `/uploads/camera-ready/${s.cameraReadyPath}`
                            : "#")
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        Tải về
                      </a>
                      <Link
                        to={`/author/submissions/${s.id}/camera-ready`}
                        className="btn-secondary btn-sm"
                      >
                        Cập nhật
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AuthorCameraReadyList;
