// src/pages/reviewer/ReviewerDiscussions.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";

const ReviewerDiscussions = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paperIdFromUrl = searchParams.get("paperId");

  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(paperIdFromUrl || "");
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    loadPapers();
  }, []);

  useEffect(() => {
    if (selectedPaperId) {
      loadDiscussions(selectedPaperId);
    }
  }, [selectedPaperId]);

  const loadPapers = async () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      const reviewerId = currentUser.id;

      // Lấy danh sách papers mà reviewer này được phân công
      const assignmentsRes = await apiClient.get(
        `/assignments/my-assignments?reviewerId=${reviewerId}`
      );
      const myPapers = assignmentsRes.data.map((a) => a.paper);
      setPapers(myPapers);

      // Nếu có paperId từ URL, set nó làm selected
      if (paperIdFromUrl) {
        setSelectedPaperId(paperIdFromUrl);
      } else if (myPapers.length > 0) {
        setSelectedPaperId(myPapers[0].id.toString());
      }
    } catch (err) {
      console.error("Load papers error:", err);
      setError("Không thể tải danh sách bài báo.");
    }
  };

  const loadDiscussions = async (paperId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/discussions/paper/${paperId}`);
      setDiscussions(res.data || []);
    } catch (err) {
      console.error("Load discussions error:", err);
      setError("Không thể tải discussions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      setError("Nội dung không được để trống");
      return;
    }
    
    if (trimmedComment.length > 10000) {
      setError("Nội dung quá dài (tối đa 10000 ký tự)");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );

      await apiClient.post("/discussions", {
        paperId: parseInt(selectedPaperId),
        authorId: currentUser.id,
        content: trimmedComment,
        parentId: null,
      });

      setNewComment("");
      loadDiscussions(selectedPaperId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Lỗi khi gửi bình luận"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    const trimmedReply = replyContent.trim();
    if (!trimmedReply) {
      setError("Nội dung trả lời không được để trống");
      return;
    }
    
    if (trimmedReply.length > 10000) {
      setError("Nội dung quá dài (tối đa 10000 ký tự)");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );

      await apiClient.post("/discussions", {
        paperId: parseInt(selectedPaperId),
        authorId: currentUser.id,
        content: trimmedReply,
        parentId: parentId,
      });

      setReplyTo(null);
      setReplyContent("");
      loadDiscussions(selectedPaperId);
    } catch (err) {
      setError(
        err.response?.data?.message || 
          err.response?.data ||
          err.message || 
          "Lỗi khi gửi trả lời"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Tổ chức discussions thành cấu trúc tree
  const organizeDiscussions = () => {
    const roots = discussions.filter((d) => !d.parentId);
    const children = discussions.filter((d) => d.parentId);

    return roots.map((root) => ({
      ...root,
      replies: children.filter((c) => c.parentId === root.id),
    }));
  };

  const organizedDiscussions = organizeDiscussions();

  return (
    <DashboardLayout
      roleLabel="Reviewer / PC"
      title="Thảo luận nội bộ PC"
      subtitle="Thảo luận private với các PC members về bài báo"
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Reviewer</span>
          </div>
          <h2 className="data-page-title">Thảo luận nội bộ PC</h2>
          <p className="data-page-subtitle">
            Trao đổi ý kiến về bài báo với các PC members khác trước khi Chair
            đưa ra quyết định cuối.
          </p>
        </div>
        <div className="data-page-header-right">
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>
        </div>
      </div>

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

      <div className="form-card" style={{ marginBottom: "2rem" }}>
        <div className="form-group">
          <label className="form-label">Chọn bài báo để xem thảo luận:</label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="form-input"
          >
            <option value="">-- Chọn bài báo --</option>
            {papers.map((paper) => (
              <option key={paper.id} value={paper.id}>
                {paper.title} (Track: {paper.track?.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPaperId && (
        <>
          <div className="form-card" style={{ marginBottom: "2rem" }}>
            <h3>Thêm bình luận mới</h3>
            <form onSubmit={handleSubmitComment} className="submission-form">
              <div className="form-group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="textarea-input"
                  placeholder="Nhập bình luận của bạn về bài báo này..."
                  disabled={submitting}
                  maxLength={10000}
                />
                <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
                  {newComment.length}/10000 ký tự
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? "Đang gửi..." : "Gửi bình luận"}
              </button>
            </form>
          </div>

          <div className="form-card">
            <h3>Danh sách thảo luận</h3>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                Đang tải...
              </div>
            ) : organizedDiscussions.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "2rem", color: "#666" }}
              >
                Chưa có thảo luận nào cho bài này. Hãy là người đầu tiên!
              </div>
            ) : (
              <div className="discussions-list">
                {organizedDiscussions.map((discussion) => (
                  <div key={discussion.id} className="discussion-item">
                    <div className="discussion-header">
                      <strong>{discussion.authorName}</strong>
                      <span className="discussion-date">
                        {formatDate(discussion.createdAt)}
                      </span>
                    </div>
                    <div className="discussion-content">
                      {discussion.content}
                    </div>
                    <div className="discussion-actions">
                      <button
                        className="btn-link"
                        onClick={() => setReplyTo(discussion.id)}
                      >
                        Trả lời
                      </button>
                    </div>

                    {/* Replies */}
                    {discussion.replies && discussion.replies.length > 0 && (
                      <div className="discussion-replies">
                        {discussion.replies.map((reply) => (
                          <div key={reply.id} className="discussion-reply">
                            <div className="discussion-header">
                              <strong>{reply.authorName}</strong>
                              <span className="discussion-date">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <div className="discussion-content">
                              {reply.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    {replyTo === discussion.id && (
                      <div className="reply-form">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                          className="textarea-input"
                          placeholder="Nhập câu trả lời..."
                          disabled={submitting}
                          maxLength={10000}
                        />
                        <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
                          {replyContent.length}/10000 ký tự
                        </div>
                        <div className="form-actions">
                          <button
                            className="btn-primary"
                            onClick={() => handleSubmitReply(discussion.id)}
                            disabled={submitting || !replyContent.trim()}
                          >
                            {submitting ? "Đang gửi..." : "Gửi trả lời"}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyContent("");
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .discussions-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .discussion-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          background: #fafafa;
        }

        .discussion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .discussion-date {
          font-size: 0.85rem;
          color: #666;
        }

        .discussion-content {
          margin-bottom: 0.75rem;
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
        }

        .discussion-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-link {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .discussion-replies {
          margin-top: 1rem;
          margin-left: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .discussion-reply {
          border-left: 3px solid #0066cc;
          padding-left: 1rem;
          background: #fff;
          padding: 0.75rem;
          border-radius: 4px;
        }

        .reply-form {
          margin-top: 1rem;
          margin-left: 2rem;
          padding: 1rem;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .reply-form .form-actions {
          margin-top: 0.75rem;
          display: flex;
          gap: 0.5rem;
        }
      `}} />
    </DashboardLayout>
  );
};

export default ReviewerDiscussions;
