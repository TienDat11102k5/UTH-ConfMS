// src/pages/author/AuthorCameraReadyList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/Layout/DashboardLayout.jsx";
import apiClient from "../../apiClient";

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
        // Try to ask backend for accepted submissions but also defensively
        // filter on client side because some backends may ignore the query
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
          // accept keywords include 'accept' to be tolerant of variants
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
        if (!ignore)
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Không thể tải danh sách submission."
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <DashboardLayout roleLabel="Author" title="Quản lý Camera-ready">
      <div className="data-page-header">
        <div className="data-page-header-left">
          <h2 className="data-page-title">Camera-ready</h2>
          <p className="data-page-subtitle">
            Danh sách các submission được chấp nhận. Tải lên bản camera-ready
            cho từng submission.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem" }}>Đang tải...</div>
      ) : (
        <div>
          {error && (
            <div className="auth-error" style={{ marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          {submissions.length === 0 ? (
            <div className="form-card">
              Chưa có submission nào được chấp nhận.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Hội nghị</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.title}</td>
                      <td>{s.conferenceName || s.conferenceId}</td>
                      <td>{s.status}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/author/submissions/${s.id}`}
                          className="btn-secondary"
                        >
                          Chi tiết
                        </Link>
                        {!s.cameraReadyPath && !s.cameraReadyDownloadUrl ? (
                          <Link
                            to={`/author/submissions/${s.id}/camera-ready`}
                            className="btn-primary"
                          >
                            Upload Camera-Ready
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
                            className="btn-secondary"
                          >
                            Đã nộp — Tải về
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AuthorCameraReadyList;
