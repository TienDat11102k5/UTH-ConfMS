import React, { useState } from "react";
import apiClient from "../apiClient";
import { useEscapeKey } from "../hooks/useKeyboardShortcut";
import "../styles/AIModal.css";

const AIDecisionModal = ({ paper, reviews, onClose }) => {
  // ESC key to close modal
  useEscapeKey(onClose);
  
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  const generateRecommendation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const avgScore = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length
        : 0;

      const response = await apiClient.post("/ai/recommend-decision", {
        paperId: paper.id,
        paperTitle: paper.title,
        averageScore: avgScore,
        reviews: reviews.map(r => ({
          score: r.score,
          comment: r.comment || "",
          recommendation: r.recommendation || ""
        })),
        conferenceId: paper.conferenceId || paper.conference?.id
      });

      setRecommendation(response.data);
    } catch (err) {
      console.error("Error generating recommendation:", err);
      setError("Không thể tạo gợi ý quyết định. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    generateRecommendation();
  }, []);

  const getRecommendationColor = (rec) => {
    if (rec === "ACCEPT") return "#10b981";
    if (rec === "REJECT") return "#ef4444";
    return "#f59e0b";
  };

  const getRecommendationBg = (rec) => {
    if (rec === "ACCEPT") return "#dcfce7";
    if (rec === "REJECT") return "#fee2e2";
    return "#fef3c7";
  };

  const getRecommendationText = (rec) => {
    if (rec === "ACCEPT") return "Chấp nhận";
    if (rec === "REJECT") return "Từ chối";
    return "Yêu cầu sửa chữa";
  };

  const getRecommendationIcon = (rec) => {
    if (rec === "ACCEPT") return "✅";
    if (rec === "REJECT") return "❌";
    return "📝";
  };

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
            ✨ AI Gợi ý Quyết định
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
                Đang phân tích đánh giá và đưa ra gợi ý...
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: "1rem",
              background: "#fee2e2",
              border: "2px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "0.9375rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {recommendation && !loading && (
            <div>
              {/* Recommendation Badge */}
              <div style={{
                textAlign: "center",
                padding: "2.5rem",
                background: getRecommendationBg(recommendation.recommendation),
                borderRadius: "12px",
                marginBottom: "1.5rem",
                border: `3px solid ${getRecommendationColor(recommendation.recommendation)}`
              }}>
                <div style={{
                  fontSize: "3.5rem",
                  marginBottom: "0.75rem"
                }}>
                  {getRecommendationIcon(recommendation.recommendation)}
                </div>
                <h2 style={{
                  color: getRecommendationColor(recommendation.recommendation),
                  margin: "0 0 0.75rem 0",
                  fontSize: "1.875rem",
                  fontWeight: 700
                }}>
                  {getRecommendationText(recommendation.recommendation)}
                </h2>
                <div style={{
                  display: "inline-block",
                  padding: "0.625rem 1.25rem",
                  background: "white",
                  borderRadius: "25px",
                  fontSize: "0.9375rem",
                  color: "#374151",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}>
                  Độ tin cậy: <strong style={{ color: getRecommendationColor(recommendation.recommendation) }}>
                    {recommendation.confidence}%
                  </strong>
                </div>
              </div>

              {/* Summary */}
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
                  📋 Tóm tắt
                </h4>
                <p style={{
                  padding: "1.25rem",
                  background: "#f9fafb",
                  borderRadius: "10px",
                  color: "#374151",
                  lineHeight: "1.7",
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  border: "2px solid #e5e7eb"
                }}>
                  {recommendation.summary}
                </p>
              </div>

              {/* Reasoning */}
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
                  💡 Lý do chi tiết
                </h4>
                <p style={{
                  padding: "1.25rem",
                  background: "#fffbeb",
                  borderRadius: "10px",
                  color: "#713f12",
                  lineHeight: "1.7",
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  border: "2px solid #fef08a"
                }}>
                  {recommendation.reasoning}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                    ✅ Điểm mạnh
                  </h4>
                  <ul style={{
                    margin: 0,
                    padding: "1rem",
                    background: "white",
                    borderRadius: "10px",
                    listStyle: "none",
                    border: "2px solid #bbf7d0"
                  }}>
                    {recommendation.strengths?.length > 0 ? (
                      recommendation.strengths.map((s, i) => (
                        <li key={i} style={{
                          padding: "0.75rem",
                          color: "#166534",
                          fontSize: "0.875rem",
                          background: "#f0fdf4",
                          borderRadius: "6px",
                          marginBottom: i < recommendation.strengths.length - 1 ? "0.5rem" : 0,
                          fontWeight: 500,
                          lineHeight: "1.5"
                        }}>
                          • {s}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic" }}>
                        Không có điểm mạnh được xác định
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
                    ⚠️ Điểm yếu
                  </h4>
                  <ul style={{
                    margin: 0,
                    padding: "1rem",
                    background: "white",
                    borderRadius: "10px",
                    listStyle: "none",
                    border: "2px solid #fecaca"
                  }}>
                    {recommendation.weaknesses?.length > 0 ? (
                      recommendation.weaknesses.map((w, i) => (
                        <li key={i} style={{
                          padding: "0.75rem",
                          color: "#991b1b",
                          fontSize: "0.875rem",
                          background: "#fef2f2",
                          borderRadius: "6px",
                          marginBottom: i < recommendation.weaknesses.length - 1 ? "0.5rem" : 0,
                          fontWeight: 500,
                          lineHeight: "1.5"
                        }}>
                          • {w}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#6b7280", fontSize: "0.875rem", fontStyle: "italic" }}>
                        Không có điểm yếu được xác định
                      </li>
                    )}
                  </ul>
                </div>
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

export default AIDecisionModal;
