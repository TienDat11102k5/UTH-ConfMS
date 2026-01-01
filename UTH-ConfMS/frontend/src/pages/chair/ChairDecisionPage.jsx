import React, { useEffect, useState } from "react";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { FiFilter, FiTrendingUp, FiSearch, FiCheckCircle, FiXCircle, FiRefreshCw } from "react-icons/fi";
import EmailDraftModal from "../../components/EmailDraftModal";
import AIDecisionModal from "../../components/AIDecisionModal";
import AIReviewSummaryModal from "../../components/AIReviewSummaryModal";
import "../../styles/ReviewerAssignments.css";
import "../../styles/ChairDecisionPage.css";

const ChairDecisionPage = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState("ALL");
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [reviews, setReviews] = useState({});
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailModal, setEmailModal] = useState({ show: false, paper: null, decision: null });
  const [aiDecisionModal, setAiDecisionModal] = useState({ show: false, paper: null });
  const [aiSummaryModal, setAiSummaryModal] = useState({ show: false, paper: null });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filteredPapers, 20);

  // Load conferences
  useEffect(() => {
    const loadConferences = async () => {
      try {
        const res = await apiClient.get("/conferences");
        setConferences(res.data || []);
        setSelectedConference("ALL");
      } catch (err) {
        console.error("Load conferences error:", err);
      }
    };
    loadConferences();
  }, []);

  // Load papers and reviews
  useEffect(() => {
    if (!selectedConference) return;

    const loadData = async () => {
      try {
        setLoading(true);
        let allPapers = [];

        if (selectedConference === "ALL") {
          for (const conf of conferences) {
            try {
              const papersRes = await apiClient.get(`/decisions/papers/${conf.id}`);
              allPapers = [...allPapers, ...(papersRes.data || [])];
            } catch (err) {
              console.error(`Error loading papers for conference ${conf.id}:`, err);
            }
          }
        } else {
          const papersRes = await apiClient.get(`/decisions/papers/${selectedConference}`);
          allPapers = papersRes.data || [];
        }

        // Chỉ lấy bài UNDER_REVIEW
        const underReviewPapers = allPapers.filter(p => p.status === 'UNDER_REVIEW');
        setPapers(underReviewPapers);

        // Load reviews và assignments cho mỗi bài
        const reviewsMap = {};
        const assignmentsMap = {};
        
        for (const paper of underReviewPapers) {
          try {
            const [reviewsRes, assignRes] = await Promise.all([
              apiClient.get(`/reviews/paper/${paper.id}`),
              apiClient.get(`/assignments/paper/${paper.id}`)
            ]);
            reviewsMap[paper.id] = reviewsRes.data || [];
            assignmentsMap[paper.id] = assignRes.data || [];
          } catch (err) {
            reviewsMap[paper.id] = [];
            assignmentsMap[paper.id] = [];
          }
        }

        setReviews(reviewsMap);
        setAssignments(assignmentsMap);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedConference, conferences]);

  // Apply filters and sorting
  useEffect(() => {
    let result = papers;

    // Filter by review status
    if (statusFilter === 'READY') {
      // Bài đã có đủ reviews (tất cả assignments đã COMPLETED)
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        return paperAssignments.length > 0 && 
               paperAssignments.every(a => a.status === 'COMPLETED');
      });
    } else if (statusFilter === 'PENDING') {
      // Bài chưa có đủ reviews
      result = papers.filter(p => {
        const paperAssignments = assignments[p.id] || [];
        return paperAssignments.length === 0 || 
               paperAssignments.some(a => a.status !== 'COMPLETED');
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.mainAuthor?.fullName?.toLowerCase().includes(query) ||
        p.track?.name?.toLowerCase().includes(query) ||
        p.conference?.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'score') {
      result.sort((a, b) => {
        const avgA = getAverageScore(a.id);
        const avgB = getAverageScore(b.id);
        return avgB - avgA;
      });
    }

    setFilteredPapers(result);
    setCurrentPage(1);
  }, [papers, statusFilter, sortBy, searchQuery, assignments, reviews, setCurrentPage]);

  const getAverageScore = (paperId) => {
    const paperReviews = reviews[paperId] || [];
    if (paperReviews.length === 0) return 0;
    const sum = paperReviews.reduce((acc, r) => acc + (r.score || 0), 0);
    return sum / paperReviews.length;
  };

  const getRecommendation = (paperId) => {
    const paperReviews = reviews[paperId] || [];
    if (paperReviews.length === 0) return null;
    
    const accepts = paperReviews.filter(r => r.recommendation === 'ACCEPT').length;
    const rejects = paperReviews.filter(r => r.recommendation === 'REJECT').length;
    
    if (accepts > rejects) return 'ACCEPT';
    if (rejects > accepts) return 'REJECT';
    return 'MIXED';
  };

  const canMakeDecision = (paperId) => {
    const paperAssignments = assignments[paperId] || [];
    return paperAssignments.length > 0 && 
           paperAssignments.every(a => a.status === 'COMPLETED');
  };

  const submitDecision = async () => {
    if (!decision) {
      alert("Vui lòng chọn quyết định!");
      return;
    }
    
    try {
      setSubmitting(true);
      await apiClient.post("/decisions", {
        paperId: selectedPaper.id,
        status: decision,
        comment,
      });
      alert("Đã ra quyết định thành công!");
      setSelectedPaper(null);
      setDecision("");
      setComment("");
      // Reload data
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout roleLabel="Program / Track Chair" title="Ra quyết định">
        <div style={{ textAlign: "center", padding: "3rem" }}>Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      roleLabel="Program / Track Chair"
      title="Ra quyết định"
      subtitle="Tổng hợp đánh giá và ra quyết định cho bài báo"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Chair</span>
          </div>
          <h2 className="data-page-title">Ra quyết định</h2>
          <p className="data-page-subtitle">
            Xem tổng hợp đánh giá từ người chấm và ra quyết định chấp nhận/từ chối bài báo
          </p>
        </div>
      </div>

      {/* Conference Selector */}
      {conferences.length > 0 && (
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
                onChange={(e) => setSelectedConference(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
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
                <option value="ALL"> Tất cả hội nghị</option>
                {conferences.map((conf) => (
                  <option key={conf.id} value={conf.id}>
                    {conf.name}
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
                  placeholder="Tìm theo tiêu đề, tác giả, chủ đề..."
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

      {/* Filter & Sort Controls */}
      {papers.length > 0 && (
        <div className="filter-sort-controls">
          <div className="filter-section">
            <div className="filter-label">
              <FiFilter />
              <span>Lọc:</span>
            </div>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả
                <span className="filter-count">{papers.length}</span>
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'READY' ? 'active' : ''}`}
                onClick={() => setStatusFilter('READY')}
              >
                Sẵn sàng quyết định
                <span className="filter-count">
                  {papers.filter(p => canMakeDecision(p.id)).length}
                </span>
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDING')}
              >
                Chưa đủ đánh giá
                <span className="filter-count">
                  {papers.filter(p => !canMakeDecision(p.id)).length}
                </span>
              </button>
            </div>
          </div>
          
          <div className="sort-section">
            <div className="sort-label">
              <FiTrendingUp />
              <span>Sắp xếp:</span>
            </div>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="score">Điểm cao nhất</option>
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        {papers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            Không có bài nào đang chờ quyết định.
          </div>
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Chủ đề</th>
                <th>Tác giả</th>
                <th>Đánh giá</th>
                <th>Điểm TB</th>
                <th>Đề xuất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((paper) => {
                const paperReviews = reviews[paper.id] || [];
                const paperAssignments = assignments[paper.id] || [];
                const avgScore = getAverageScore(paper.id);
                const recommendation = getRecommendation(paper.id);
                const ready = canMakeDecision(paper.id);

                return (
                  <tr key={paper.id}>
                    <td>
                      <strong>{paper.title}</strong>
                      {selectedConference === "ALL" && paper.conference && (
                        <div style={{ 
                          fontSize: "0.75rem", 
                          color: "#6b7280", 
                          marginTop: "0.25rem",
                          fontWeight: 500
                        }}>
                          🏛️ {paper.conference.name}
                        </div>
                      )}
                    </td>
                    <td>{paper.track?.name || "N/A"}</td>
                    <td>{paper.mainAuthor?.fullName || "N/A"}</td>
                    <td>
                      <div style={{ fontSize: "0.875rem" }}>
                        {paperReviews.length}/{paperAssignments.length}
                        {!ready && (
                          <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                            Chưa đủ
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        color: avgScore >= 1 ? "#10b981" : avgScore <= -1 ? "#ef4444" : "#6b7280"
                      }}>
                        {avgScore.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {recommendation === 'ACCEPT' && (
                        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <FiCheckCircle size={14} /> Chấp nhận
                        </span>
                      )}
                      {recommendation === 'REJECT' && (
                        <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <FiXCircle size={14} /> Từ chối
                        </span>
                      )}
                      {recommendation === 'MIXED' && (
                        <span className="badge badge-warning">Trái chiều</span>
                      )}
                      {!recommendation && (
                        <span style={{ color: "#999", fontSize: "0.875rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          className="btn-primary table-action"
                          onClick={() => {
                            setSelectedPaper(paper);
                            setDecision("");
                            setComment("");
                          }}
                          disabled={!ready}
                          style={{ minWidth: "110px", fontSize: "0.8125rem" }}
                          title={!ready ? "Cần đủ đánh giá từ tất cả người chấm" : ""}
                        >
                          Ra quyết định
                        </button>
                        
                        {paperReviews.length > 0 && (
                          <>
                            <button
                              onClick={() => setAiDecisionModal({ show: true, paper })}
                              style={{
                                padding: "0.5rem 0.75rem",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem"
                              }}
                              title="AI gợi ý quyết định"
                            >
                              ✨ Gợi ý
                            </button>
                            
                            <button
                              onClick={() => setAiSummaryModal({ show: true, paper })}
                              style={{
                                padding: "0.5rem 0.75rem",
                                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem"
                              }}
                              title="AI tóm tắt reviews"
                            >
                              ✨ Tóm tắt
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredPapers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPapers.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemName="bài báo"
        />
      )}

      {/* Modal */}
      {selectedPaper && (
        <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <h3 style={{ marginBottom: "1rem" }}>{selectedPaper.title}</h3>

            {/* Tổng hợp đánh giá */}
            <div style={{ 
              background: "#f8fafc", 
              padding: "1rem", 
              borderRadius: "8px", 
              marginBottom: "1.5rem",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    Số đánh giá
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                    {(reviews[selectedPaper.id] || []).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    Điểm trung bình
                  </div>
                  <div style={{ 
                    fontSize: "1.5rem", 
                    fontWeight: 700,
                    color: getAverageScore(selectedPaper.id) >= 1 ? "#10b981" : 
                           getAverageScore(selectedPaper.id) <= -1 ? "#ef4444" : "#6b7280"
                  }}>
                    {getAverageScore(selectedPaper.id).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                    Đề xuất chung
                  </div>
                  <div style={{ marginTop: "0.25rem" }}>
                    {getRecommendation(selectedPaper.id) === 'ACCEPT' && (
                      <span className="badge badge-success">Chấp nhận</span>
                    )}
                    {getRecommendation(selectedPaper.id) === 'REJECT' && (
                      <span className="badge badge-danger">Từ chối</span>
                    )}
                    {getRecommendation(selectedPaper.id) === 'MIXED' && (
                      <span className="badge badge-warning">Trái chiều</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chi tiết từng đánh giá */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "#374151" }}>
                  Chi tiết đánh giá:
                </div>
                {(reviews[selectedPaper.id] || []).map((review, idx) => (
                  <div key={review.id} style={{ 
                    background: "white", 
                    padding: "0.75rem", 
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1f2937" }}>
                        Người chấm #{idx + 1}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ 
                          fontWeight: 600, 
                          fontSize: "0.9375rem",
                          color: review.score >= 1 ? "#10b981" : review.score <= -1 ? "#ef4444" : "#6b7280"
                        }}>
                          Điểm: {review.score}
                        </span>
                        {review.recommendation === 'ACCEPT' && (
                          <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>Chấp nhận</span>
                        )}
                        {review.recommendation === 'REJECT' && (
                          <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>Từ chối</span>
                        )}
                      </div>
                    </div>
                    {review.comments && (
                      <div style={{ fontSize: "0.8125rem", color: "#6b7280", fontStyle: "italic" }}>
                        "{review.comments}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Form */}
            <div className="form-group">
              <label className="form-label">Quyết định của Chair *</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="form-input"
              >
                <option value="">-- Chọn quyết định --</option>
                <option value="ACCEPTED">✓ Chấp nhận (ACCEPTED)</option>
                <option value="REJECTED">✗ Từ chối (REJECTED)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú nội bộ (tùy chọn)</label>
              <textarea
                placeholder="Ghi chú cho quyết định này..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-input"
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                disabled={submitting || !decision}
                onClick={submitDecision}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận quyết định"}
              </button>
              
              {decision && (
                <button
                  onClick={() => {
                    setEmailModal({
                      show: true,
                      paper: selectedPaper,
                      decision: decision
                    });
                  }}
                  disabled={submitting}
                  style={{
                    padding: "0.625rem 1rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  title="AI soạn email thông báo quyết định"
                >
                  ✨ Soạn email AI
                </button>
              )}
              
              <button
                className="btn-secondary"
                onClick={() => setSelectedPaper(null)}
                disabled={submitting}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Decision Modal */}
      {aiDecisionModal.show && (
        <AIDecisionModal
          paper={aiDecisionModal.paper}
          reviews={reviews[aiDecisionModal.paper.id] || []}
          onClose={() => setAiDecisionModal({ show: false, paper: null })}
        />
      )}

      {/* AI Summary Modal */}
      {aiSummaryModal.show && (
        <AIReviewSummaryModal
          paper={aiSummaryModal.paper}
          reviews={reviews[aiSummaryModal.paper.id] || []}
          onClose={() => setAiSummaryModal({ show: false, paper: null })}
        />
      )}

      {/* Email Draft Modal */}
      {emailModal.show && (
        <EmailDraftModal
          paper={emailModal.paper}
          decision={emailModal.decision}
          conferenceName={emailModal.paper?.conference?.name}
          onClose={() => setEmailModal({ show: false, paper: null, decision: null })}
          onSend={async () => {
            // Sau khi gửi email thành công, tự động submit quyết định
            try {
              await apiClient.post("/decisions", {
                paperId: emailModal.paper.id,
                status: emailModal.decision,
                comment: comment || "Đã gửi email thông báo quyết định",
                skipEmail: true // Bỏ qua email tự động vì đã gửi bằng AI
              });
              alert("✅ Đã gửi email và ra quyết định thành công!");
              setEmailModal({ show: false, paper: null, decision: null });
              setSelectedPaper(null);
              setDecision("");
              setComment("");
              window.location.reload();
            } catch (err) {
              alert("⚠️ Email đã gửi nhưng lỗi khi lưu quyết định: " + (err.response?.data || err.message));
            }
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default ChairDecisionPage;
