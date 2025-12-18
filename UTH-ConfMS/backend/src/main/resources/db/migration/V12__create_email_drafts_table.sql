-- Migration: Create email drafts table
-- Version: V12
-- Date: 2025-01-XX

CREATE TABLE IF NOT EXISTS email_drafts (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- ACCEPT_NOTIFICATION, REJECT_NOTIFICATION, REVIEWER_REMINDER, REVIEWER_INVITATION
    recipient_id BIGINT, -- Author ID or Reviewer ID
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(50),
    personalization TEXT, -- JSON string
    generated_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, SENT, CANCELLED
    approved_by BIGINT, -- User ID of chair who approved
    edited_subject TEXT, -- Chair's edited version
    edited_body TEXT, -- Chair's edited version
    paper_id BIGINT, -- For decision emails
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_conference_id ON email_drafts(conference_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_email_drafts_paper_id ON email_drafts(paper_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_recipient_id ON email_drafts(recipient_id);

COMMENT ON TABLE email_drafts IS 'AI-generated email drafts for chair review and approval';
COMMENT ON COLUMN email_drafts.email_type IS 'Type of email: ACCEPT_NOTIFICATION, REJECT_NOTIFICATION, REVIEWER_REMINDER, REVIEWER_INVITATION';
COMMENT ON COLUMN email_drafts.status IS 'Draft status: DRAFT, APPROVED, SENT, CANCELLED';
COMMENT ON COLUMN email_drafts.edited_subject IS 'Chair-edited subject (if different from AI-generated)';
COMMENT ON COLUMN email_drafts.edited_body IS 'Chair-edited body (if different from AI-generated)';


