/**
 * EmailDraftEditor Component
 * Editor for AI-generated email drafts with side-by-side comparison.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./EmailDraftEditor.css";

const EmailDraftEditor = ({
  draft,
  onApprove,
  onCancel,
  onSend,
}) => {
  const { t } = useTranslation();
  const [editedSubject, setEditedSubject] = useState(draft?.subject || "");
  const [editedBody, setEditedBody] = useState(draft?.body || "");
  const [showPreview, setShowPreview] = useState(false);

  const hasChanges =
    editedSubject !== draft?.subject || editedBody !== draft?.body;

  const handleApprove = () => {
    if (onApprove) {
      onApprove({
        draftId: draft.draft_id,
        editedSubject: hasChanges ? editedSubject : null,
        editedBody: hasChanges ? editedBody : null,
      });
    }
  };

  const handleSend = () => {
    if (onSend) {
      onSend({
        draftId: draft.draft_id,
        subject: editedSubject,
        body: editedBody,
      });
    }
  };

  if (!draft) return null;

  return (
    <div className="email-draft-editor">
      <div className="editor-header">
        <h3>{t('components.emailEditor.title')}</h3>
        <div className="editor-badges">
          <span className="badge ai-badge">{t('components.emailEditor.aiGenerated')}</span>
          <span className="badge review-badge">{t('components.emailEditor.requiresReview')}</span>
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${!showPreview ? "active" : ""}`}
          onClick={() => setShowPreview(false)}
        >
          {t('app.edit')}
        </button>
        <button
          className={`tab ${showPreview ? "active" : ""}`}
          onClick={() => setShowPreview(true)}
        >
          {t('components.emailEditor.preview')}
        </button>
      </div>

      {!showPreview ? (
        <div className="editor-content">
          <div className="editor-section">
            <label>{t('components.emailEditor.subject')}</label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="subject-input"
              placeholder={t('components.emailEditor.subjectPlaceholder')}
            />
            {hasChanges && editedSubject !== draft.subject && (
              <div className="change-indicator">
                <small>{t('components.emailEditor.changedFrom')}: "{draft.subject}"</small>
              </div>
            )}
          </div>

          <div className="editor-section">
            <label>{t('components.emailEditor.body')}</label>
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="body-textarea"
              rows={15}
              placeholder={t('components.emailEditor.bodyPlaceholder')}
            />
            {hasChanges && editedBody !== draft.body && (
              <div className="change-indicator">
                <small>{t('components.emailEditor.bodyEdited')}</small>
              </div>
            )}
          </div>

          {draft.rationale && (
            <div className="rationale-box">
              <strong>{t('components.emailEditor.aiRationale')}:</strong>
              <p>{draft.rationale}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="preview-content">
          <div className="email-preview">
            <div className="email-header">
              <div className="email-field">
                <strong>{t('components.emailEditor.to')}:</strong> {draft.personalization?.author_name || t('components.emailEditor.recipient')}
              </div>
              <div className="email-field">
                <strong>{t('components.emailEditor.subject')}:</strong> {editedSubject}
              </div>
            </div>
            <div className="email-body-preview">
              {editedBody.split("\n").map((line, index) => (
                <p key={index}>{line || "\u00A0"}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="editor-actions">
        <button onClick={onCancel} className="cancel-button">
          {t('app.cancel')}
        </button>
        <button onClick={handleApprove} className="approve-button">
          {hasChanges ? t('common.saveChanges') : t('components.emailEditor.approveDraft')}
        </button>
        {draft.status === "APPROVED" && (
          <button onClick={handleSend} className="send-button">
            {t('components.emailEditor.sendEmail')}
          </button>
        )}
      </div>

      <div className="editor-footer">
        <small>
          ⚠️ {t('components.emailEditor.disclaimer')}
        </small>
      </div>
    </div>
  );
};

export default EmailDraftEditor;
