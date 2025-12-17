// src/pages/author/ConferenceDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import "../../styles/ConferenceDetail.css";

const formatDateTime = (dateString) => {
  if (!dateString) return "Đang cập nhật";
  try {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const ConferenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conf, setConf] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get(`/conferences/${id}`, {
          skipAuth: true,
        });
        setConf(res.data);
      } catch (err) {
        console.error("Load conference detail error:", err);
        const status = err?.response?.status;
        if (status === 404) {
          setError("Hội nghị không tồn tại.");
        } else if (status === 401 || status === 403) {
          navigate("/login");
          return;
        } else {
          setError("Không thể tải chi tiết hội nghị. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="portal-page">
        <PortalHeader />
        <div className="conf-detail-loading">
          Đang tải chi tiết hội nghị...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-page">
        <PortalHeader />
        <div className="conf-detail-error">{error}</div>
        <div className="conf-detail-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!conf) return null;

  const submissionDeadline =
    conf.submissionDeadline ||
    conf.submitDeadline ||
    conf.deadline ||
    conf.paperDeadline;

  const reviewDeadline = conf.reviewDeadline;
  const cameraReadyDeadline = conf.cameraReadyDeadline;

  const blindReview =
    conf.isBlindReview === true ||
    conf.blindReview === true ||
    conf.isBlindReview === "true";

  const isPastDeadline = (() => {
    if (!submissionDeadline) return false;
    try {
      return Date.now() > new Date(submissionDeadline).getTime();
    } catch {
      return false;
    }
  })();

  return (
    <div className="portal-page">
      <PortalHeader />

      <main className="conf-detail">
        {/* ===== HEADER ===== */}
        <div className="conf-detail-header">
          <div>
            <div className="badge-soft">Hội nghị · ID #{conf.id}</div>
            <h1 className="conf-detail-title">{conf.name}</h1>
            <p className="conf-detail-desc">
              {conf.description ||
                "Hội nghị khoa học được tổ chức bởi UTH. Theo dõi timeline, chủ đề và nộp bài tại đây."}
            </p>

            <div className="conf-detail-meta">
              <div className="meta-item">
                <span className="meta-label">Ngày bắt đầu</span>
                <span className="meta-value">
                  {formatDateTime(conf.startDate)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Ngày kết thúc</span>
                <span className="meta-value">
                  {formatDateTime(conf.endDate)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Hạn nộp bài</span>
                <span className="meta-value">
                  {formatDateTime(submissionDeadline)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Hạn review</span>
                <span className="meta-value">
                  {formatDateTime(reviewDeadline)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Hạn camera-ready</span>
                <span className="meta-value">
                  {formatDateTime(cameraReadyDeadline)}
                </span>
              </div>
            </div>

            <div className="conf-detail-cta">
              <Link
                to={`/author/submissions/new?confId=${conf.id}`}
                className={`btn-primary ${isPastDeadline ? "disabled" : ""}`}
                onClick={(e) => isPastDeadline && e.preventDefault()}
                aria-disabled={isPastDeadline}
              >
                {isPastDeadline ? "Đã quá hạn nộp bài" : "Nộp bài ngay"}
              </Link>

              <Link to="/author/dashboard" className="btn-secondary">
                Vào dashboard tác giả
              </Link>

              <Link
                to={`/author/submissions?confId=${conf.id}`}
                className="btn-secondary"
              >
                Bài đã nộp cho hội nghị này
              </Link>
            </div>
          </div>

          <div className="conf-detail-card">
            <h3>Thông tin chính</h3>
            <ul>
              <li>
                <strong>Chủ đề / Tracks:</strong>{" "}
                {conf.tracks?.length
                  ? `${conf.tracks.length} tracks`
                  : "Đang cập nhật"}
              </li>
              <li>
                <strong>Blind review:</strong>{" "}
                {blindReview ? "Có" : "Không"}
              </li>
              <li>
                <strong>Tên hội nghị:</strong> {conf.name}
              </li>
            </ul>
          </div>
        </div>

        {/* ===== TIMELINE CARD ===== */}
        <section className="conf-detail-section">
          <h2>Timeline hội nghị</h2>

          <div className="timeline-cards">
            <div className="timeline-card done">
              <div className="timeline-icon">✓</div>
              <h4>Mở nộp bài</h4>
              <span>{formatDateTime(conf.startDate)}</span>
            </div>

            <div
              className={`timeline-card ${
                isPastDeadline ? "done" : "current"
              }`}
            >
              <div className="timeline-icon">
                {isPastDeadline ? "✓" : "✍"}
              </div>
              <h4>Nộp bài</h4>
              <span>{formatDateTime(submissionDeadline)}</span>
            </div>

            <div className="timeline-card upcoming">
              <div className="timeline-icon">🔍</div>
              <h4>Review</h4>
              <span>{formatDateTime(reviewDeadline)}</span>
            </div>

            <div className="timeline-card upcoming">
              <div className="timeline-icon">📄</div>
              <h4>Camera-ready</h4>
              <span>{formatDateTime(cameraReadyDeadline)}</span>
            </div>

            <div className="timeline-card upcoming">
              <div className="timeline-icon">🎤</div>
              <h4>Hội nghị</h4>
              <span>{formatDateTime(conf.endDate)}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ConferenceDetail;
