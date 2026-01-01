import React, { useState } from "react";
import apiClient from "../apiClient";
import "../styles/AIModal.css";

const AIReviewSummaryModal = ({ paper, reviews, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/ai/summarize-reviews", {
        paperId: paper.id,
        paperTitle: paper.title,
        reviews: reviews.map(r => ({
          reviewerName: r.reviewer?.fullName || "Ẩn danh",
          score: r.score,
          comment: r.comment || "",
          recommendation: r.recommendation || ""
        })),
        conferenceId: paper.conferenceId || paper.conference?.id
      });

      setSummary(response.data);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Không thể tạo tóm tắt reviews. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    generateSummary();
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px", background: "white" }}>
        <div className="modal-header" style={{
          background: "white",
          color: "#1e293b",
          padding: "1.5rem",
          borderRadius: "12px 12px 0 0",
          borderBottom: "2px solid #e5e7eb"
        }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            ✨ AI Tóm tắt Đánh giá
          </h3>
          <button onClick={onClose} style={{
            background: "#f3f4f6",
            border: "none",
            color: "#6b7280",
            fontSize: "1.5rem",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
          >×</button>
        </div>

        <div className="modal-body" style={{ padding: "1.5rem" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner"></div>
              <p style={{ marginTop: "1rem", color: "#6b7280", fontSize: "0.9375rem" }}>
                Đang phân tích và tổng hợp đánh giá...
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: "1rem",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "0.9375rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {summary && !loading && (
            <div>
              {/* Overall Summary */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ 
                  color: "#1e293b", 
                  marginBottom: "0.75rem", 
                  fontSize: "1rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  📝 Tổng quan
                </h4>
                <p style={{
                  padding: "1.25rem",
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  border: "2px solid #bae6fd",
                  borderRadius: "10px",
                  color: "#0c4a6e",
                  lineHeight: "1.7",
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 500
                }}>
                  {summary.overallSummary}
                </p>
              </div>

              {/* Consensus */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ 
                  color: "#1e293b", 
                  marginBottom: "0.75rem", 
                  fontSize: "1rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  🤝 Mức độ đồng thuận
                </h4>
                <p style={{
                  padding: "1.25rem",
                  background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                  border: "2px solid #fef08a",
                  borderRadius: "10px",
                  color: "#713f12",
                  lineHeight: "1.7",
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 500
                }}>
                  {summary.consensus}
                </p>
              </div>

              {/* Common Strengths & Weaknesses */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h4 style={{ 
                    color: "#059669", 
                    marginBottom: "0.75rem", 
                    fontSize: "1rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    ✅ Điểm mạnh chung
                  </h4>
                  <ul style={{
                    margin: 0,
                    padding: "1rem",
                    background: "white",
                    borderRadius: "10px",
                    listStyle: "none",
                    border: "2px solid #bbf7d0"
                  }}>
                    {summary.commonStrengths?.length > 0 ? (
                      summary.commonStrengths.map((s, i) => (
                        <li key={i} style={{
                          padding: "0.75rem",
                          color: "#166534",
                          fontSize: "0.875rem",
                          background: "#f0fdf4",
                          borderRadius: "6px",
                          marginBottom: i < summary.commonStrengths.length - 1 ? "0.5rem" : 0,
                          fontWeight: 500,
                          lineHeight: "1.5"
                        }}>
                          • {s}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic" }}>
                        Không có điểm mạnh chung được xác định
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 style={{ 
                    color: "#dc2626", 
                    marginBottom: "0.75rem", 
                    fontSize: "1rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    ⚠️ Điểm yếu chung
                  </h4>
                  <ul style={{
                    margin: 0,
                    padding: "1rem",
                    background: "white",
                    borderRadius: "10px",
                    listStyle: "none",
                    border: "2px solid #fecaca"
                  }}>
                    {summary.commonWeaknesses?.length > 0 ? (
                      summary.commonWeaknesses.map((w, i) => (
                        <li key={i} style={{
                          padding: "0.75rem",
                          color: "#991b1b",
                          fontSize: "0.875rem",
                          background: "#fef2f2",
                          borderRadius: "6px",
                          marginBottom: i < summary.commonWeaknesses.length - 1 ? "0.5rem" : 0,
                          fontWeight: 500,
                          lineHeight: "1.5"
                        }}>
                          • {w}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic" }}>
                        Không có điểm yếu chung được xác định
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Key Points */}
              <div>
                <h4 style={{ 
                  color: "#1e293b", 
                  marginBottom: "0.75rem", 
                  fontSize: "1rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  🔑 Các điểm chính
                </h4>
                <ul style={{
                  margin: 0,
                  padding: "1rem",
                  background: "#f9fafb",
                  borderRadius: "10px",
                  listStyle: "none",
                  border: "2px solid #e5e7eb"
                }}>
                  {summary.keyPoints?.length > 0 ? (
                    summary.keyPoints.map((point, i) => (
                      <li key={i} style={{
                        padding: "1rem",
                        color: "#374151",
                        fontSize: "0.875rem",
                        background: "white",
                        borderRadius: "8px",
                        marginBottom: i < summary.keyPoints.length - 1 ? "0.5rem" : 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        fontWeight: 500,
                        lineHeight: "1.6"
                      }}>
                        <strong style={{ color: "#0d9488" }}>{i + 1}.</strong> {point}
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic", padding: "0.5rem" }}>
                      Không có điểm chính nào được xác định
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{
          padding: "1rem 1.5rem",
          borderTop: "2px solid #e5e7eb",
          display: "flex",
          justifyContent: "flex-end",
          background: "white"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.75rem",
              background: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#0f766e"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#0d9488"}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIReviewSummaryModal;
