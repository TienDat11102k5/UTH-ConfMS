// src/pages/reviewer/ReviewerDiscussions.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../apiClient";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import { ListSkeleton } from "../../components/LoadingSkeleton";
import { ToastContainer } from "../../components/Toast";
import { FiMessageSquare, FiSend, FiX, FiCornerDownRight, FiClock } from 'react-icons/fi';

const ReviewerDiscussions = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paperIdFromUrl = searchParams.get("paperId");

  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(paperIdFromUrl || "");
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

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
      addToast(t('reviewer.discussionsPage.loadPapersError'), "error");
    }
  };

  const loadDiscussions = async (paperId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/discussions/paper/${paperId}`);
      setDiscussions(res.data || []);
    } catch (err) {
      console.error("Load discussions error:", err);
      addToast(t('reviewer.discussionsPage.loadDiscussionsError'), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      addToast(t('reviewer.discussionsPage.emptyContent'), "warning");
      return;
    }

    if (trimmedComment.length > 10000) {
      addToast(t('reviewer.discussionsPage.contentTooLong'), "warning");
      return;
    }

    setSubmitting(true);

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
      addToast(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        t('reviewer.discussionsPage.commentError'),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    const trimmedReply = replyContent.trim();
    if (!trimmedReply) {
      addToast(t('reviewer.discussionsPage.emptyReply'), "warning");
      return;
    }

    if (trimmedReply.length > 10000) {
      addToast(t('reviewer.discussionsPage.contentTooLong'), "warning");
      return;
    }

    setSubmitting(true);

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
      addToast(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        t('reviewer.discussionsPage.replyError'),
        "error"
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
      roleLabel="Reviewer"
      title={t('reviewer.discussionsPage.title')}
      subtitle={t('reviewer.discussionsPage.subtitle')}
    >
      <div className="data-page-header">
        <div className="data-page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">{t('reviewer.discussionsPage.breadcrumb')}</span>
          </div>
          <h2 className="data-page-title">
            <FiMessageSquare style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            {t('reviewer.discussionsPage.title')}
          </h2>
          <p className="data-page-subtitle">
            {t('reviewer.discussionsPage.description')}
          </p>
        </div>
        <div className="data-page-header-right">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← {t('common.back')}
          </button>
        </div>
      </div>


      {/* Paper Selector */}
      <div style={{
        marginBottom: "1.5rem",
        background: "white",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
      }}>
        <label style={{
          display: "block",
          marginBottom: "0.5rem",
          fontWeight: 600,
          color: "#64748b",
          fontSize: "0.875rem",
        }}>
          {t('reviewer.discussionsPage.selectPaper')}:
        </label>
        <select
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(e.target.value)}
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
          <option value="">-- {t('reviewer.discussionsPage.selectPaper')} --</option>
          {papers.map((paper) => (
            <option key={paper.id} value={paper.id}>
              {paper.title} ({t('reviewer.discussionsPage.topic')}: {paper.track?.name})
            </option>
          ))}
        </select>
      </div>

      {selectedPaperId && (
        <>
          {/* New Comment Form */}
          <div style={{
            marginBottom: "1.5rem",
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              <FiSend size={16} />
              {t('reviewer.discussionsPage.addComment')}
            </div>
            <form onSubmit={handleSubmitComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="comment-textarea"
                placeholder={t('reviewer.discussionsPage.commentPlaceholder')}
                disabled={submitting}
                maxLength={10000}
              />
              <div className="textarea-footer">
                <span className="char-count">{newComment.length}/10000 {t('reviewer.discussionsPage.characters')}</span>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !newComment.trim()}
                >
                  <FiSend size={16} style={{ marginRight: "0.5rem" }} />
                  {submitting ? t('app.loading') : t('reviewer.discussionsPage.sendComment')}
                </button>
              </div>
            </form>
          </div>

          {/* Discussions List */}
          <div style={{
            background: "white",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontWeight: 600,
              color: "#64748b",
              fontSize: "0.875rem",
            }}>
              <FiMessageSquare size={16} />
              {t('reviewer.discussionsPage.discussionList')} ({organizedDiscussions.length})
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              {loading ? (
                <ListSkeleton items={3} />
              ) : organizedDiscussions.length === 0 ? (
                <div className="empty-state">
                  <FiMessageSquare size={48} style={{ color: "#cbd5e1" }} />
                  <p>{t('reviewer.discussionsPage.noDiscussions')}</p>
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{t('reviewer.discussionsPage.beFirst')}</p>
                </div>
              ) : (
                <div className="discussions-list">
                  {organizedDiscussions.map((discussion) => (
                    <div key={discussion.id} className="discussion-item">
                      <div className="discussion-header">
                        <div className="author-info">
                          <div className="author-avatar">{discussion.authorName?.charAt(0)?.toUpperCase() || 'U'}</div>
                          <div>
                            <div className="author-name">{discussion.authorName}</div>
                            <div className="discussion-time">
                              <FiClock size={14} />
                              {formatDate(discussion.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="discussion-content">{discussion.content}</div>
                      <div className="discussion-actions">
                        <button
                          className="reply-btn"
                          onClick={() => setReplyTo(discussion.id)}
                        >
                          <FiCornerDownRight size={16} />
                          {t('reviewer.discussionsPage.reply')}
                        </button>
                      </div>

                      {discussion.replies && discussion.replies.length > 0 && (
                        <div className="discussion-replies">
                          {discussion.replies.map((reply) => (
                            <div key={reply.id} className="discussion-reply">
                              <div className="reply-indicator">
                                <FiCornerDownRight size={16} />
                              </div>
                              <div className="reply-content-wrapper">
                                <div className="discussion-header">
                                  <div className="author-info">
                                    <div className="author-avatar small">{reply.authorName?.charAt(0)?.toUpperCase() || 'U'}</div>
                                    <div>
                                      <div className="author-name">{reply.authorName}</div>
                                      <div className="discussion-time">
                                        <FiClock size={12} />
                                        {formatDate(reply.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="discussion-content">{reply.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyTo === discussion.id && (
                        <div className="reply-form">
                          <div className="reply-form-header">
                            <FiCornerDownRight size={16} />
                            <span>{t('reviewer.discussionsPage.replyTo')} {discussion.authorName}</span>
                          </div>
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={3}
                            className="comment-textarea"
                            placeholder={t('reviewer.discussionsPage.replyPlaceholder')}
                            disabled={submitting}
                            maxLength={10000}
                          />
                          <div className="textarea-footer">
                            <span className="char-count">{replyContent.length}/10000 {t('reviewer.discussionsPage.characters')}</span>
                            <div className="form-actions">
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  setReplyTo(null);
                                  setReplyContent("");
                                }}
                              >
                                <FiX size={16} style={{ marginRight: "0.5rem" }} />
                                {t('common.cancel')}
                              </button>
                              <button
                                className="btn-primary"
                                onClick={() => handleSubmitReply(discussion.id)}
                                disabled={submitting || !replyContent.trim()}
                              >
                                <FiSend size={16} style={{ marginRight: "0.5rem" }} />
                                {submitting ? t('app.loading') : t('reviewer.discussionsPage.send')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .alert-error {
          background: #fee;
          border: 1px solid #f5c6cb;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          color: #721c24;
        }

        .discussion-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .discussion-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .discussion-card-body {
          padding: 1.5rem;
        }

        .paper-select {
          display: none;
        }

        .comment-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comment-textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
          transition: all 0.2s;
        }

        .comment-textarea:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .char-count {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .empty-state p {
          margin-top: 1rem;
          font-size: 1rem;
        }

        .discussions-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .discussion-item {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fafbfc;
          transition: all 0.2s;
        }

        .discussion-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .discussion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
        }

        .author-avatar.small {
          width: 32px;
          height: 32px;
          font-size: 0.875rem;
        }

        .author-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
        }

        .discussion-time {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 0.15rem;
        }

        .discussion-content {
          color: #334155;
          line-height: 1.7;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin-bottom: 1rem;
        }

        .discussion-actions {
          display: flex;
          gap: 1rem;
        }

        .reply-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: #0d9488;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .reply-btn:hover {
          background: #f0fdfa;
          color: #14b8a6;
        }

        .discussion-replies {
          margin-top: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .discussion-reply {
          display: flex;
          gap: 0.75rem;
          padding-left: 1rem;
        }

        .reply-indicator {
          color: #0d9488;
          flex-shrink: 0;
          padding-top: 0.25rem;
        }

        .reply-content-wrapper {
          flex: 1;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
        }

        .reply-content-wrapper .discussion-header {
          margin-bottom: 0.75rem;
        }

        .reply-content-wrapper .discussion-content {
          margin-bottom: 0;
        }

        .reply-form {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: white;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }

        .reply-form-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #0d9488;
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
        }
      `}} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DashboardLayout>
  );
};

export default ReviewerDiscussions;
