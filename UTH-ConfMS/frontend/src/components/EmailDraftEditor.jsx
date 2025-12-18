/**
 * EmailDraftEditor Component
 * Editor for AI-generated email drafts with side-by-side comparison.
 */
import React, { useState } from "react";
import "./EmailDraftEditor.css";

const EmailDraftEditor = ({
  draft,
  onApprove,
  onCancel,
  onSend,
}) => {
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
        <h3>Email Draft Editor</h3>
        <div className="editor-badges">
          <span className="badge ai-badge">AI Generated</span>
          <span className="badge review-badge">Requires Review</span>
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${!showPreview ? "active" : ""}`}
          onClick={() => setShowPreview(false)}
        >
          Edit
        </button>
        <button
          className={`tab ${showPreview ? "active" : ""}`}
          onClick={() => setShowPreview(true)}
        >
          Preview
        </button>
      </div>

      {!showPreview ? (
        <div className="editor-content">
          <div className="editor-section">
            <label>Subject</label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="subject-input"
              placeholder="Email subject"
            />
            {hasChanges && editedSubject !== draft.subject && (
              <div className="change-indicator">
                <small>Changed from: "{draft.subject}"</small>
              </div>
            )}
          </div>

          <div className="editor-section">
            <label>Body</label>
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="body-textarea"
              rows={15}
              placeholder="Email body"
            />
            {hasChanges && editedBody !== draft.body && (
              <div className="change-indicator">
                <small>Body has been edited</small>
              </div>
            )}
          </div>

          {draft.rationale && (
            <div className="rationale-box">
              <strong>AI Rationale:</strong>
              <p>{draft.rationale}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="preview-content">
          <div className="email-preview">
            <div className="email-header">
              <div className="email-field">
                <strong>To:</strong> {draft.personalization?.author_name || "Recipient"}
              </div>
              <div className="email-field">
                <strong>Subject:</strong> {editedSubject}
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
          Cancel
        </button>
        <button onClick={handleApprove} className="approve-button">
          {hasChanges ? "Save Changes" : "Approve Draft"}
        </button>
        {draft.status === "APPROVED" && (
          <button onClick={handleSend} className="send-button">
            Send Email
          </button>
        )}
      </div>

      <div className="editor-footer">
        <small>
          ⚠️ All email drafts require chair review before sending. No emails are
          sent automatically.
        </small>
      </div>
    </div>
  );
};

export default EmailDraftEditor;


