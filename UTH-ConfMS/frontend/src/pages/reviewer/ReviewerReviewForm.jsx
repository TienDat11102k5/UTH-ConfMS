// src/pages/reviewer/ReviewerReviewForm.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ReviewerReviewForm = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    score: 0,
    confidenceLevel: 3,
    commentForAuthor: "",
    commentForPC: "",
  });

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
        setAssignment(assignmentRes.data);

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
        setError("Không thể tải thông tin assignment.");
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
      alert(
        "Chỉ có thể chấm bài khi đã chấp nhận assignment (status = ACCEPTED)!"
      );
      return;
    }

    if (existingReview) {
      alert("Bạn đã chấm bài này rồi. Không thể sửa đổi.");
      return;
    }

    // Validate form data
    if (!formData.commentForAuthor || !formData.commentForPC) {
      alert("Vui lòng điền đầy đủ các nhận xét!");
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

      alert("Gửi review thành công!");
      navigate("/reviewer/assignments");
    } catch (err) {
      console.error("Submit error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message || err.message || "Lỗi khi gửi review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Form Review">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout roleLabel="Reviewer / PC" title="Form Review">
        <div style={{ color: "#d32f2f", padding: "1rem" }}>
          Không tìm thấy assignment.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Form Review"
      subtitle={`Chấm bài: ${assignment.paper?.title || "N/A"}`}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Reviewer</span>
          </div>
          <h2 className="data-page-title">Form Review</h2>
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
          <strong>Lưu ý:</strong> Bạn đã chấm bài này rồi. Không thể sửa đổi.
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
          <h3>Thông tin bài báo</h3>

          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <p style={{ marginBottom: "1rem" }}>
              <strong>Tiêu đề:</strong> {assignment.paper?.title}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>Track:</strong> {assignment.paper?.track?.name}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>Tác giả chính:</strong>{" "}
              {assignment.paper?.mainAuthor?.fullName}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong>Email tác giả:</strong>{" "}
              {assignment.paper?.mainAuthor?.email}
            </p>
            {assignment.paper?.keywords && (
              <p style={{ marginBottom: "1rem" }}>
                <strong>Từ khóa:</strong> {assignment.paper.keywords}
              </p>
            )}
            {assignment.paper?.abstractText && (
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <strong>Abstract:</strong>
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
            {assignment.paper?.filePath && (
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
                  📄 File bài báo đã nộp:
                </strong>
                <a
                  href={`http://localhost:8080/uploads/submissions/${assignment.paper.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0066cc",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontWeight: "600",
                  }}
                >
                  🔗 Mở/Tải xuống file bài báo
                </a>
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  Click vào link trên để xem hoặc tải file PDF/DOC của bài báo
                  để chấm
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
              Điểm số (Score) *{" "}
              <span style={{ fontSize: "0.9em", color: "#666" }}>
                (-3 đến +3)
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
              <option value="-3">-3 (Rất không phù hợp)</option>
              <option value="-2">-2 (Không phù hợp)</option>
              <option value="-1">-1 (Hơi không phù hợp)</option>
              <option value="0">0 (Trung lập)</option>
              <option value="1">+1 (Hơi phù hợp)</option>
              <option value="2">+2 (Phù hợp)</option>
              <option value="3">+3 (Rất phù hợp)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mức độ tự tin (Confidence Level) *{" "}
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
              <option value="1">1 - Rất không chắc</option>
              <option value="2">2 - Không chắc</option>
              <option value="3">3 - Trung bình</option>
              <option value="4">4 - Chắc chắn</option>
              <option value="5">5 - Rất chắc chắn</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Nhận xét cho tác giả (Comment for Author) *
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
              placeholder="Nhận xét chi tiết về bài báo, điểm mạnh, điểm yếu, đề xuất cải thiện..."
            />
            <div className="field-hint">
              Nhận xét này sẽ được gửi cho tác giả (ẩn danh nếu double-blind)
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Nhận xét cho PC (Comment for PC) *
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
              placeholder="Nhận xét nội bộ cho Program Committee, khuyến nghị Accept/Reject..."
            />
            <div className="field-hint">
              Nhận xét này chỉ dành cho PC và Chair, tác giả không được xem
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || existingReview !== null}
            >
              {submitting
                ? "Đang gửi..."
                : existingReview
                ? "Đã chấm"
                : "Gửi Review"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/reviewer/assignments")}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ReviewerReviewForm;
