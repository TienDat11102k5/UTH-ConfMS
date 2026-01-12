// src/pages/author/AuthorCameraReadyList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import apiClient from "../../apiClient";
import { FiSearch } from "react-icons/fi";
import "../../styles/AuthorPages.css";

const AuthorCameraReadyList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

        // Extract unique conferences
        const uniqueConfs = [
          ...new Set(
            accepted
              .map((s) => s.conferenceName || s.conferenceId)
              .filter(Boolean)
          ),
        ];
        if (!ignore) setConferences(uniqueConfs);
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

  // Import formatDateTime from dateUtils for consistent UTC+7 display
  const formatDate = (value) => {
    if (!value) return "";
    try {
      // Use formatDateTime from dateUtils.js for UTC+7 consistency
      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return "";
      
      // Add 7 hours for Vietnam timezone
      const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      const day = String(vietnamDate.getDate()).padStart(2, '0');
      const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
      const year = vietnamDate.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return value;
    }
  };

  // Filter submissions by conference and search query
  const filteredSubmissions = submissions.filter((s) => {
    // Filter by conference
    if (selectedConference && (s.conferenceName || s.conferenceId) !== selectedConference) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        s.title?.toLowerCase().includes(query) ||
        s.conferenceName?.toLowerCase().includes(query) ||
        s.trackName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <DashboardLayout roleLabel="Author" title="Nộp bản hoàn chỉnh ">
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
            <span className="breadcrumb-current">Bản hoàn chỉnh </span>
          </div>

          <p className="data-page-subtitle">
            Danh sách các bài báo được chấp nhận. Tải lên bản hoàn chỉnh cho
            từng bài nộp trước khi kết thúc.
          </p>
        </div>
      </div>

      {/* Filter Box - Same style as chair/reviewer */}
      {!loading && submissions.length > 0 && (
        <div
          style={{
            marginBottom: "1.25rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: "block",
                marginBottom: "0.5rem", 
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                Chọn hội nghị:
              </label>
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "8px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "white",
                  color: "#475569",
                }}
              >
                <option value="">Tất cả hội nghị</option>
                {conferences.map((conf, idx) => (
                  <option key={idx} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ 
                display: "block",
                marginBottom: "0.5rem", 
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.875rem",
              }}>
                Tìm kiếm:
              </label>
              <div style={{ position: "relative" }}>
                <FiSearch style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  width: "16px",
                  height: "16px"
                }} />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, hội nghị, track..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.875rem 0.5rem 2.5rem",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "0.8125rem",
                    background: "white",
                    color: "#475569",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="auth-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
          Đang tải danh sách...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>
            {selectedConference
              ? "Không tìm thấy bài báo"
              : "Chưa có bài báo được chấp nhận"}
          </h3>
          <p>
            {selectedConference
              ? "Không có bài báo nào cho hội nghị này. Thử chọn hội nghị khác."
              : "Khi có bài báo được chấp nhận, bạn sẽ thấy danh sách ở đây để tải lên bản camera-ready."}
          </p>
          {selectedConference ? (
            <button
              className="btn-primary"
              onClick={() => setSelectedConference("")}
            >
              Xem tất cả
            </button>
          ) : (
            <Link to="/author/submissions" className="btn-primary">
              Xem danh sách bài nộp
            </Link>
          )}
        </div>
      ) : (
        <div className="camera-ready-grid">
          {filteredSubmissions.map((s) => {
            const hasCameraReady =
              s.cameraReadyPath || s.cameraReadyDownloadUrl;

            return (
              <div key={s.id} className="camera-ready-card">
                <div className="camera-ready-header">
                  <span className="submission-id">#{s.id}</span>
                  <span className="status-badge-compact accepted">CHẤP NHẬN</span>
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        style={{ marginRight: "0.25rem" }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"
                        />
                      </svg>
                      Nộp bản cuối
                    </Link>
                  ) : (
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        style={{ marginRight: "0.25rem" }}
                      >
                        <path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z" />
                        <path d="M7.646 11.854a.5.5 0 00.708 0l3-3a.5.5 0 00-.708-.708L8.5 10.293V1.5a.5.5 0 00-1 0v8.793L5.354 8.146a.5.5 0 10-.708.708l3 3z" />
                      </svg>
                      Tải về
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: "3rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "0.875rem"
      }}>
        © {new Date().getFullYear()} Hệ thống quản lý hội nghị khoa học - Trường Đại học Giao thông Vận tải
      </footer>
    </DashboardLayout>
  );
};

export default AuthorCameraReadyList;
