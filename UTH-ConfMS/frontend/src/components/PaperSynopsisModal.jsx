import React, { useState } from "react";
import apiClient from "../apiClient";

const PaperSynopsisModal = ({ paper, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [synopsis, setSynopsis] = useState(null);
  const [error, setError] = useState("");

  const generateSynopsis = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await apiClient.post("/ai/synopsis", {
        title: paper.title,
        abstractText: paper.abstractText,
        language: "vietnamese",
        length: "medium",
        conferenceId: paper.conferenceId
      });
      
      setSynopsis(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể tạo tóm tắt. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    generateSynopsis();
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        maxWidth: "900px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px 12px 0 0"
        }}>
          <h3 style={{ margin: 0, color: "white", fontSize: "1.25rem", fontWeight: 600 }}>
            ✨ Tóm tắt bài báo bởi AI
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              fontSize: "1.5rem",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {/* Paper Info */}
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
              {paper.title}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Tác giả: {paper.authorName || "N/A"}
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                border: "4px solid #e0e7ff",
                borderTop: "4px solid #6366f1",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px"
              }} />
              <div style={{ color: "#6b7280" }}>Đang tạo tóm tắt...</div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "16px",
              color: "#991b1b"
            }}>
              {error}
            </div>
          )}

          {synopsis && !loading && (
            <div>
              {/* Synopsis */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                  padding: "10px 14px",
                  borderRadius: "8px 8px 0 0",
                  fontWeight: 600,
                  color: "#1e40af",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "1.1rem" }}>📝</span>
                  Tóm tắt
                </div>
                <div style={{
                  background: "#f0f9ff",
                  padding: "16px",
                  borderRadius: "0 0 8px 8px",
                  border: "1px solid #bfdbfe",
                  borderTop: "none",
                  lineHeight: "1.6",
                  color: "#1e3a8a"
                }}>
                  {synopsis.synopsis}
                </div>
              </div>

              {/* Key Themes */}
              {synopsis.keyThemes && synopsis.keyThemes.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>🎯</span>
                    Chủ đề chính
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {synopsis.keyThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                          color: "#1e293b",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: 500
                        }}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Methodology */}
              {synopsis.methodology && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>🔬</span>
                    Phương pháp
                  </div>
                  <div style={{
                    background: "#f9fafb",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    lineHeight: "1.6"
                  }}>
                    {synopsis.methodology}
                  </div>
                </div>
              )}

              {/* Claims */}
              {synopsis.claims && synopsis.claims.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>💡</span>
                    Các khẳng định chính
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#374151", lineHeight: "1.8" }}>
                    {synopsis.claims.map((claim, idx) => (
                      <li key={idx}>{claim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Datasets */}
              {synopsis.datasets && synopsis.datasets.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>📊</span>
                    Dữ liệu sử dụng
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {synopsis.datasets.map((dataset, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: 500
                        }}
                      >
                        {dataset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contribution Type & Word Count */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "20px"
              }}>
                {synopsis.contributionType && (
                  <div style={{
                    background: "#f0fdf4",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #bbf7d0"
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "#166534", marginBottom: "4px" }}>
                      Loại đóng góp
                    </div>
                    <div style={{ fontWeight: 600, color: "#15803d" }}>
                      {synopsis.contributionType}
                    </div>
                  </div>
                )}
                {synopsis.wordCount && (
                  <div style={{
                    background: "#fef3f9",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #fecdd3"
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "#9f1239", marginBottom: "4px" }}>
                      Số từ ước tính
                    </div>
                    <div style={{ fontWeight: 600, color: "#be123c" }}>
                      {synopsis.wordCount} từ
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperSynopsisModal;
