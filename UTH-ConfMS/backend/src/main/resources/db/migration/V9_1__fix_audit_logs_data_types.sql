-- Migration: Fix audit_logs table data types
-- Version: V9.1
-- Date: 2025-01-10
-- Description: Ensures audit_logs columns have correct data types

-- Drop table if it exists with wrong schema
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Recreate with correct schema
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(500),
    ip_address VARCHAR(45),
    details TEXT,
    user_id BIGINT,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Comments
COMMENT ON TABLE audit_logs IS 'System-wide audit log for security and compliance';
COMMENT ON COLUMN audit_logs.actor IS 'Email or identifier of the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., LOGIN_SUCCESS, CREATE_CONFERENCE)';
COMMENT ON COLUMN audit_logs.target IS 'Target of the action (e.g., conference name, paper ID)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the actor';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action';
