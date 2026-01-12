// src/pages/author/ConferenceDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import PortalHeader from "../../components/PortalHeader";
import { formatDateTime } from "../../utils/dateUtils";
import "../../styles/ConferenceDetail.css";



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
        <div className="conf-detail-loading">Đang tải chi tiết hội nghị...</div>
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
          <div className="badge-soft">{conf.name}</div>
          <div className="conf-title-row">
            <h1 className="conf-detail-title">{conf.name}</h1>
            {blindReview && (
              <span className="blind-review-badge" title="Blind Review">
                Ẩn danh
              </span>
            )}
          </div>

          <div className="conf-detail-meta">
            <div className="meta-item">
              <span className="meta-label">Ngày bắt đầu</span>
              <span className="meta-value">
                {formatDateTime(conf.startDate)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ngày kết thúc</span>
              <span className="meta-value">{formatDateTime(conf.endDate)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Hạn nộp bài</span>
              <span className="meta-value">
                {formatDateTime(submissionDeadline)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Hạn chấm bài</span>
              <span className="meta-value">
                {formatDateTime(reviewDeadline)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Hạn nộp bản cuối </span>
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
       
            <Link
              to={`/author/submissions?confId=${conf.id}`}
              className="btn-secondary"
            >
              Bài nộp của tôi
            </Link>
          </div>
        </div>

        {/* ===== CHỦ ĐỀ VÀ MÔ TẢ ===== */}
        {(conf.tracks && conf.tracks.length > 0) || conf.description ? (
          <section className="conf-detail-section">
            <div className="conf-detail-card">
              {/* Chủ đề / Tracks */}
              {conf.tracks && conf.tracks.length > 0 && (
                <div
                  style={{ marginBottom: conf.description ? "2.5rem" : "0" }}
                >
                  <h2 className="section-title" style={{ marginTop: 0 }}>
                    Chủ đề
                  </h2>
                  <div className="conf-detail-tracks">
                    {conf.tracks.map((track, index) => (
                      <div key={track.id || index} className="track-badge">
                        <span className="track-badge-name">{track.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả */}
              {conf.description && (
                <div>
                  <h2 className="section-title" style={{ marginTop: 0 }}>
                    Mô tả chi tiết
                  </h2>
                  <div className="conf-description">
                    <p>{conf.description}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default ConferenceDetail;
