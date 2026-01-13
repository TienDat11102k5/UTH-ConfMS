import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";

const EmailDraftModal = ({ paper, decision, conferenceName, onClose, onSend }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  const getEmailTypeText = (type) => {
    const map = {
      ACCEPT: t('components.emailDraft.accept'),
      REJECT: t('components.emailDraft.reject'),
      REVISION: t('components.emailDraft.revision'),
      REMINDER: t('components.emailDraft.reminder')
    };
    return map[type] || type;
  };

  const generateDraft = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log('📧 Generating email draft...', {
        decision,
        paperTitle: paper.title,
        conferenceId: paper.conferenceId || paper.conference?.id
      });
      
      const response = await apiClient.post("/ai/draft-email", {
        emailType: decision,
        recipientName: paper.authorName || paper.mainAuthor?.fullName || t('common.author'),
        paperTitle: paper.title,
        conferenceName: conferenceName || paper.conference?.name || t('common.conference'),
        decision: decision,
        comments: additionalComments,
        language: "vietnamese",
        conferenceId: paper.conferenceId || paper.conference?.id || null
      });
      
      console.log('✅ Email draft generated:', response.data);
      setEmailDraft(response.data);
      setEditedSubject(response.data.subject);
      setEditedBody(response.data.body);
    } catch (err) {
      console.error('❌ Error generating email draft:', err);
      console.error('Error response:', err.response?.data);
      
      // Fallback: Tạo email template đơn giản
      const fallbackEmail = createFallbackEmail();
      setEmailDraft(fallbackEmail);
      setEditedSubject(fallbackEmail.subject);
      setEditedBody(fallbackEmail.body);
      setError(t('components.emailDraft.aiUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  const createFallbackEmail = () => {
    const recipientName = paper.authorName || paper.mainAuthor?.fullName || t('common.author');
    const confName = conferenceName || paper.conference?.name || t('common.conference');
    
    let subject = "";
    let body = "";
    
    if (decision === "ACCEPTED") {
      subject = `[${confName}] ${t('components.emailDraft.acceptSubject')}: ${paper.title}`;
      body = `${t('components.emailDraft.dearRecipient', { name: recipientName })}\n\n${t('components.emailDraft.acceptBody', { title: paper.title, conference: confName })}\n\n${additionalComments ? `${t('components.emailDraft.comments')}: ${additionalComments}\n\n` : ''}${t('components.emailDraft.prepareCamera')}\n\n${t('components.emailDraft.regards')}\n${t('components.emailDraft.organizer')} ${confName}`;
    } else if (decision === "REJECTED") {
      subject = `[${confName}] ${t('components.emailDraft.paperNotice')}: ${paper.title}`;
      body = `${t('components.emailDraft.dearRecipient', { name: recipientName })}\n\n${t('components.emailDraft.rejectBody', { title: paper.title, conference: confName })}\n\n${additionalComments ? `${t('components.emailDraft.comments')}: ${additionalComments}\n\n` : ''}${t('components.emailDraft.encourageContinue')}\n\n${t('components.emailDraft.regards')}\n${t('components.emailDraft.organizer')} ${confName}`;
    } else {
      subject = `[${confName}] ${t('components.emailDraft.paperNotice')}: ${paper.title}`;
      body = `${t('components.emailDraft.dearRecipient', { name: recipientName })}\n\n${t('components.emailDraft.genericBody', { title: paper.title, conference: confName })}\n\n${additionalComments || ''}\n\n${t('components.emailDraft.regards')}\n${t('components.emailDraft.organizer')} ${confName}`;
    }
    
    return { subject, body, language: "vietnamese" };
  };

  React.useEffect(() => {
    generateDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await apiClient.post("/decisions/send-email", {
        to: paper.authorEmail || paper.mainAuthor?.email,
        subject: editedSubject,
        body: editedBody
      });
      
      if (response.data.success) {
        alert(t('components.emailDraft.sendSuccess'));
        if (onSend) {
          onSend({
            to: paper.authorEmail || paper.mainAuthor?.email,
            subject: editedSubject,
            body: editedBody,
            paperId: paper.id
          });
        }
        onClose();
      } else {
        setError(t('components.emailDraft.sendFailed'));
      }
    } catch (err) {
      console.error("Error sending email:", err);
      setError(t('components.emailDraft.sendError') + ": " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: "800px",
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
            ✨ {t('components.emailDraft.title')}
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
          {/* Paper & Decision Info */}
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.875rem" }}>
              <div>
                <span style={{ color: "#6b7280" }}>{t('components.emailDraft.paper')}:</span>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: "4px" }}>
                  {paper.title}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{t('components.emailDraft.decision')}:</span>
                <div style={{ fontWeight: 600, color: decision === "ACCEPT" ? "#059669" : "#dc2626", marginTop: "4px" }}>
                  {getEmailTypeText(decision)}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{t('components.emailDraft.recipient')}:</span>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: "4px" }}>
                  {paper.authorName || paper.mainAuthor?.fullName || "N/A"}
                </div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Email:</span>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: "4px" }}>
                  {paper.authorEmail || paper.mainAuthor?.email || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Comments */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "8px",
              fontSize: "0.9rem"
            }}>
              {t('components.emailDraft.additionalComments')}:
            </label>
            <textarea
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder={t('components.emailDraft.commentsPlaceholder')}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                minHeight: "80px",
                resize: "vertical"
              }}
            />
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
              <div style={{ color: "#6b7280" }}>{t('components.emailDraft.generating')}</div>
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

          {emailDraft && !loading && (
            <div>
              {/* Subject */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <label style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem"
                  }}>
                    {t('components.emailDraft.emailSubject')}:
                  </label>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        background: "transparent",
                        border: "1px solid #d1d5db",
                        color: "#6b7280",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        cursor: "pointer"
                      }}
                    >
                      ✏️ {t('app.edit')}
                    </button>
                  )}
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #3b82f6",
                      fontSize: "0.9rem",
                      fontFamily: "inherit"
                    }}
                  />
                ) : (
                  <div style={{
                    background: "#f0f9ff",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                    color: "#1e3a8a",
                    fontWeight: 500
                  }}>
                    {editedSubject}
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                  fontSize: "0.9rem"
                }}>
                  {t('components.emailDraft.emailContent')}:
                </label>
                {editing ? (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "2px solid #3b82f6",
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      minHeight: "300px",
                      resize: "vertical",
                      lineHeight: "1.6"
                    }}
                  />
                ) : (
                  <div style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    lineHeight: "1.8",
                    whiteSpace: "pre-wrap",
                    maxHeight: "400px",
                    overflow: "auto"
                  }}>
                    {editedBody}
                  </div>
                )}
              </div>

              {editing && (
                <div style={{
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "0.875rem",
                  color: "#92400e",
                  marginBottom: "20px"
                }}>
                  💡 <strong>{t('components.emailDraft.note')}:</strong> {t('components.emailDraft.editNote')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
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
            {t('app.cancel')}
          </button>
          <div style={{ display: "flex", gap: "12px" }}>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                ✓ {t('app.done')}
              </button>
            )}
            {!editing && emailDraft && (
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)"
                }}
              >
                {loading ? t('app.sending') : `📧 ${t('components.emailDraft.sendEmail')}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftModal;
