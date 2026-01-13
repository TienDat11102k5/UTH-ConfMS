// src/pages/reviewer/ReviewerReviewForm.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import { getToken } from "../../auth";  // ✅ IMPORT getToken
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PaperSynopsisModal from "../../components/PaperSynopsisModal";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import { ToastContainer } from "../../components/Toast";

const ReviewerReviewForm = () => {
  const { t } = useTranslation();
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [synopsisModal, setSynopsisModal] = useState({ show: false, paper: null });

  const [formData, setFormData] = useState({
    score: 0,
    confidenceLevel: 3,
    commentForAuthor: "",
    commentForPC: "",
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load assignment
        const assignmentRes = await apiClient.get(
          `/assignments/${assignmentId}`
        );
        console.log("Assignment data:", assignmentRes.data);
        console.log("Paper data:", assignmentRes.data?.paper);
        console.log("File Path:", assignmentRes.data?.paper?.filePath);
        
        // Add conferenceId to paper object for AI features
        const assignmentData = assignmentRes.data;
        if (assignmentData.paper && assignmentData.paper.track) {
          assignmentData.paper.conferenceId = assignmentData.paper.track.conferenceId;
        }
        
        setAssignment(assignmentData);

        // Check if review already exists
        try {
          const reviewRes = await apiClient.get(
            `/reviews/assignment/${assignmentId}`
          );
          console.log("Review response:", reviewRes.data);

          // Chỉ set existingReview nếu thực sự có review (không phải null hoặc empty object)
          if (reviewRes.data && reviewRes.data.id) {
            setExistingReview(reviewRes.data);
            // Pre-fill form if review exists
            setFormData({
              score: reviewRes.data.score || 0,
              confidenceLevel: reviewRes.data.confidenceLevel || 3,
              commentForAuthor: reviewRes.data.commentForAuthor || "",
              commentForPC: reviewRes.data.commentForPC || "",
            });
          } else {
            console.log("No existing review found");
            setExistingReview(null);
          }
        } catch (err) {
          console.log("No review yet (expected):", err.response?.status);
          // Review doesn't exist yet, that's okay
          setExistingReview(null);
        }
      } catch (err) {
        console.error("Load error:", err);
        setError(t('reviewer.reviewForm.loadError'));
      } finally {
        setLoading(false);
      }
    };
    if (assignmentId) loadData();
  }, [assignmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== SUBMIT REVIEW ===");
    console.log("Assignment status:", assignment?.status);
    console.log("Existing review:", existingReview);
    console.log("Form data:", formData);

    if (assignment?.status !== "ACCEPTED") {
      addToast(t('reviewer.reviewForm.acceptedStatusRequired'), "warning");
      return;
    }

    if (existingReview) {
      addToast(t('reviewer.reviewForm.alreadyReviewed'), "warning");
      return;
    }

    // Validate form data
    if (!formData.commentForAuthor || !formData.commentForPC) {
      addToast(t('reviewer.reviewForm.fillAllComments'), "warning");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        assignmentId: parseInt(assignmentId),
        score: parseInt(formData.score),
        confidenceLevel: parseInt(formData.confidenceLevel),
        commentForAuthor: formData.commentForAuthor,
        commentForPC: formData.commentForPC,
      };

      console.log("Sending payload:", payload);

      const response = await apiClient.post("/reviews", payload);

      console.log("Response:", response.data);

      addToast(t('reviewer.reviewForm.submitSuccess'), "success");
      setTimeout(() => navigate("/reviewer/assignments"), 800);
    } catch (err) {
      console.error("Submit error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message || err.message || t('reviewer.reviewForm.submitError')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPaper = async () => {
    try {
      const token = getToken();  // ✅ SỬA: Dùng getToken() thay vì localStorage.getItem("token")
      console.log("=== DOWNLOAD PAPER DEBUG ===");
      console.log("Token exists:", !!token);
      console.log("Token length:", token ? token.length : 0);
      console.log("Paper ID:", assignment.paper.id);
      
      if (!token) {
        addToast(t('reviewer.reviewForm.pleaseLogin'), "warning");
        return;
      }

      console.log("Fetching PDF from:", `http://localhost:8080/api/submissions/${assignment.paper.id}/download`);
      
      const response = await fetch(
        `http://localhost:8080/api/submissions/${assignment.paper.id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        if (response.status === 403) {
          addToast(t('reviewer.reviewForm.noPermission'), "error");
        } else if (response.status === 404) {
          addToast(t('reviewer.reviewForm.fileNotFound'), "error");
        } else {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          addToast(t('reviewer.reviewForm.downloadError') + ": " + response.statusText, "error");
        }
        return;
      }

      console.log("Creating blob...");
      // Open PDF in new tab instead of downloading
      const blob = await response.blob();
      console.log("Blob size:", blob.size);
      console.log("Blob type:", blob.type);
      
      const url = window.URL.createObjectURL(blob);
      console.log("Opening PDF in new tab...");
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Clean up after a delay (to allow browser to load the PDF)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Download error:", err);
      addToast(t('reviewer.reviewForm.openFileError') + ": " + err.message, "error");
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title={t('reviewer.reviewForm.title')}>
        <CardSkeleton count={1} />
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title={t('reviewer.reviewForm.title')}>
        <div style={{ color: "#d32f2f", padding: "1rem" }}>
          {t('reviewer.reviewForm.notFound')}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title={t('reviewer.reviewForm.title')}
      subtitle={`${t('reviewer.reviewForm.reviewPaper')}: ${assignment.paper?.title || "N/A"}`}
    >
      <div style={{ marginBottom: "1rem" }}>
        <button 
          className="btn-back" 
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          ← {t('reviewer.reviewForm.backToAssignments')}
        </button>
      </div>
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">{t('roles.reviewer')}</span>
          </div>
          <h2 className="data-page-title">{t('reviewer.reviewForm.title')}</h2>
        </div>
      </div>

      {existingReview && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <strong>{t('reviewer.reviewForm.noteLabel')}</strong> {t('reviewer.reviewForm.alreadyReviewedMsg')}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#ffebee",
            border: "1px solid #d32f2f",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      <div className="form-card">
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>{t('reviewer.reviewForm.paperInfo')}</h3>
            <button
              type="button"
              onClick={() => setSynopsisModal({ show: true, paper: assignment.paper })}
              style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              ✨ {t('reviewer.reviewForm.aiSummary')}
            </button>
          </div>

          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <p style={{ marginBottom: "1rem" }}>
              <strong>{t('reviewer.reviewForm.paperTitle')}:</strong> {assignment.paper?.title}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>{t('reviewer.reviewForm.track')}:</strong> {assignment.paper?.track?.name}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>{t('reviewer.reviewForm.mainAuthor')}:</strong>{" "}
              {assignment.paper?.mainAuthor?.fullName}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>{t('reviewer.reviewForm.authorEmail')}:</strong>{" "}
              {assignment.paper?.mainAuthor?.email}
            </p>
            {assignment.paper?.keywords && (
              <p style={{ marginBottom: "1rem" }}>
                <strong>{t('reviewer.reviewForm.keywords')}:</strong> {assignment.paper.keywords}
              </p>
            )}
            {assignment.paper?.abstractText && (
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <strong>{t('reviewer.reviewForm.abstractLabel')}:</strong>
                <p
                  style={{
                    marginTop: "0.5rem",
                    color: "#666",
                    lineHeight: "1.6",
                  }}
                >
                  {assignment.paper.abstractText}
                </p>
              </div>
            )}
            {assignment.paper?.id && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                  border: "2px solid #0066cc",
                }}
              >
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                  📄 {t('reviewer.reviewForm.submittedFile')}:
                </strong>
                <button
                  onClick={handleDownloadPaper}
                  type="button"
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0066cc",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  🔍 {t('reviewer.reviewForm.viewPaperFile')}
                </button>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  {t('reviewer.reviewForm.clickToViewHint')}
                </p>
                <p
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    color: "#999",
                  }}
                >
                  File: {assignment.paper.filePath}
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
            <label className="form-label">
              {t('reviewer.reviewForm.scoreLabel')} *{" "}
              <span style={{ fontSize: "0.9em", color: "#666" }}>
                {t('reviewer.reviewForm.scoreRange')}
              </span>
            </label>
            <select
              value={formData.score}
              onChange={(e) =>
                setFormData({ ...formData, score: e.target.value })
              }
              required
              disabled={existingReview !== null}
              className="form-input"
            >
              <option value="-3">-3 ({t('reviewer.reviewForm.scoreVeryInappropriate')})</option>
              <option value="-2">-2 ({t('reviewer.reviewForm.scoreInappropriate')})</option>
              <option value="-1">-1 ({t('reviewer.reviewForm.scoreSomewhatInappropriate')})</option>
              <option value="0">0 ({t('reviewer.reviewForm.scoreNeutral')})</option>
              <option value="1">+1 ({t('reviewer.reviewForm.scoreSomewhatAppropriate')})</option>
              <option value="2">+2 ({t('reviewer.reviewForm.scoreAppropriate')})</option>
              <option value="3">+3 ({t('reviewer.reviewForm.scoreVeryAppropriate')})</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('reviewer.reviewForm.confidenceLabel')} *{" "}
              <span style={{ fontSize: "0.9em", color: "#666" }}>(1-5)</span>
            </label>
            <select
              value={formData.confidenceLevel}
              onChange={(e) =>
                setFormData({ ...formData, confidenceLevel: e.target.value })
              }
              required
              disabled={existingReview !== null}
              className="form-input"
            >
              <option value="1">1 - {t('reviewer.reviewForm.confVeryNotConfident')}</option>
              <option value="2">2 - {t('reviewer.reviewForm.confNotConfident')}</option>
              <option value="3">3 - {t('reviewer.reviewForm.confMedium')}</option>
              <option value="4">4 - {t('reviewer.reviewForm.confConfident')}</option>
              <option value="5">5 - {t('reviewer.reviewForm.confVeryConfident')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('reviewer.reviewForm.commentForAuthorLabel')} *
            </label>
            <textarea
              value={formData.commentForAuthor}
              onChange={(e) =>
                setFormData({ ...formData, commentForAuthor: e.target.value })
              }
              required
              disabled={existingReview !== null}
              rows={6}
              className="textarea-input"
              placeholder={t('reviewer.reviewForm.commentForAuthorPlaceholder')}
            />
            <div className="field-hint">
              {t('reviewer.reviewForm.commentForAuthorHint')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('reviewer.reviewForm.commentForPCLabel')} *
            </label>
            <textarea
              value={formData.commentForPC}
              onChange={(e) =>
                setFormData({ ...formData, commentForPC: e.target.value })
              }
              required
              disabled={existingReview !== null}
              rows={6}
              className="textarea-input"
              placeholder={t('reviewer.reviewForm.commentForPCPlaceholder')}
            />
            <div className="field-hint">
              {t('reviewer.reviewForm.commentForPCHint')}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || existingReview !== null}
            >
              {submitting
                ? t('reviewer.reviewForm.submitting')
                : existingReview
                ? t('reviewer.reviewForm.alreadySubmitted')
                : t('reviewer.reviewForm.submitReview')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/reviewer/assignments")}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>

      {/* Paper Synopsis Modal */}
      {synopsisModal.show && (
        <PaperSynopsisModal
          paper={synopsisModal.paper}
          onClose={() => setSynopsisModal({ show: false, paper: null })}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ReviewerReviewForm;
