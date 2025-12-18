-- Migration: Create AI Service tables for governance, feature flags, and audit logging
-- Version: V10
-- Date: 2025-01-XX
-- Description: Creates tables for AI feature flags, audit logs, and usage statistics

-- ============================================
-- Table: ai_feature_flags
-- Purpose: Store feature flags per conference
-- ============================================
CREATE TABLE IF NOT EXISTS ai_feature_flags (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one flag per conference+feature combination
    UNIQUE(conference_id, feature_name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_feature_flags_conference 
    ON ai_feature_flags(conference_id);
CREATE INDEX IF NOT EXISTS idx_ai_feature_flags_feature 
    ON ai_feature_flags(feature_name);

-- Add foreign key constraint if conferences table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conferences') THEN
        ALTER TABLE ai_feature_flags
        ADD CONSTRAINT fk_ai_feature_flags_conference
        FOREIGN KEY (conference_id) REFERENCES conferences(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE ai_feature_flags IS 'Feature flags for AI features per conference';
COMMENT ON COLUMN ai_feature_flags.conference_id IS 'ID of the conference (BIGINT)';
COMMENT ON COLUMN ai_feature_flags.feature_name IS 'Name of the AI feature (spell_check, grammar_check, etc.)';
COMMENT ON COLUMN ai_feature_flags.enabled IS 'Whether the feature is enabled for this conference';

-- ============================================
-- Table: ai_audit_logs
-- Purpose: Audit trail for all AI operations
-- ============================================
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conference_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    feature VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    input_hash VARCHAR(64) NOT NULL, -- SHA256 hash
    output_summary TEXT,
    accepted BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_conference 
    ON ai_audit_logs(conference_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user 
    ON ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_feature 
    ON ai_audit_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_timestamp 
    ON ai_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_input_hash 
    ON ai_audit_logs(input_hash);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_accepted 
    ON ai_audit_logs(accepted) WHERE accepted IS NOT NULL;

-- Composite index for usage stats queries
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_conference_feature_timestamp 
    ON ai_audit_logs(conference_id, feature, timestamp DESC);

-- Add foreign key constraints if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conferences') THEN
        ALTER TABLE ai_audit_logs
        ADD CONSTRAINT fk_ai_audit_logs_conference
        FOREIGN KEY (conference_id) REFERENCES conferences(id)
        ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE ai_audit_logs
        ADD CONSTRAINT fk_ai_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE ai_audit_logs IS 'Audit log for all AI operations';
COMMENT ON COLUMN ai_audit_logs.conference_id IS 'ID of the conference (BIGINT)';
COMMENT ON COLUMN ai_audit_logs.user_id IS 'ID of the user who triggered the operation (BIGINT)';
COMMENT ON COLUMN ai_audit_logs.feature IS 'Name of the AI feature';
COMMENT ON COLUMN ai_audit_logs.action IS 'Action performed (e.g., check_spelling, generate_summary)';
COMMENT ON COLUMN ai_audit_logs.prompt IS 'User prompt or input text (truncated to 10000 chars)';
COMMENT ON COLUMN ai_audit_logs.model_id IS 'LLM model identifier (e.g., gpt-4o-mini)';
COMMENT ON COLUMN ai_audit_logs.input_hash IS 'SHA256 hash of input for deduplication';
COMMENT ON COLUMN ai_audit_logs.output_summary IS 'Summary of AI output (truncated to 5000 chars)';
COMMENT ON COLUMN ai_audit_logs.accepted IS 'Whether user accepted the AI suggestion (NULL = pending)';
COMMENT ON COLUMN ai_audit_logs.metadata IS 'Additional metadata as JSON';

-- ============================================
-- Table: ai_usage_stats
-- Purpose: Aggregated usage statistics (optional, can be materialized from audit_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL,
    feature VARCHAR(100) NOT NULL,
    total_calls INTEGER NOT NULL DEFAULT 0,
    accepted_calls INTEGER NOT NULL DEFAULT 0,
    rejected_calls INTEGER NOT NULL DEFAULT 0,
    pending_calls INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- One stat per conference+feature+date
    UNIQUE(conference_id, feature, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_conference 
    ON ai_usage_stats(conference_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_date 
    ON ai_usage_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_conference_date 
    ON ai_usage_stats(conference_id, date DESC);

-- Add foreign key constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conferences') THEN
        ALTER TABLE ai_usage_stats
        ADD CONSTRAINT fk_ai_usage_stats_conference
        FOREIGN KEY (conference_id) REFERENCES conferences(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE ai_usage_stats IS 'Aggregated usage statistics for AI features';
COMMENT ON COLUMN ai_usage_stats.conference_id IS 'ID of the conference (BIGINT)';
COMMENT ON COLUMN ai_usage_stats.feature IS 'Name of the AI feature';
COMMENT ON COLUMN ai_usage_stats.total_calls IS 'Total number of AI calls';
COMMENT ON COLUMN ai_usage_stats.accepted_calls IS 'Number of accepted AI suggestions';
COMMENT ON COLUMN ai_usage_stats.rejected_calls IS 'Number of rejected AI suggestions';
COMMENT ON COLUMN ai_usage_stats.pending_calls IS 'Number of pending AI suggestions';
COMMENT ON COLUMN ai_usage_stats.date IS 'Date of the statistics';

-- ============================================
-- Function: Update usage stats (optional helper)
-- ============================================
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ai_usage_stats (
        conference_id, feature, date,
        total_calls, accepted_calls, rejected_calls, pending_calls
    )
    VALUES (
        NEW.conference_id,
        NEW.feature,
        DATE(NEW.timestamp),
        1,
        CASE WHEN NEW.accepted = true THEN 1 ELSE 0 END,
        CASE WHEN NEW.accepted = false THEN 1 ELSE 0 END,
        CASE WHEN NEW.accepted IS NULL THEN 1 ELSE 0 END
    )
    ON CONFLICT (conference_id, feature, date)
    DO UPDATE SET
        total_calls = ai_usage_stats.total_calls + 1,
        accepted_calls = ai_usage_stats.accepted_calls + 
            CASE WHEN NEW.accepted = true THEN 1 ELSE 0 END,
        rejected_calls = ai_usage_stats.rejected_calls + 
            CASE WHEN NEW.accepted = false THEN 1 ELSE 0 END,
        pending_calls = ai_usage_stats.pending_calls + 
            CASE WHEN NEW.accepted IS NULL THEN 1 ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats (optional, can be disabled if using scheduled aggregation)
-- Uncomment if you want automatic stats updates:
-- CREATE TRIGGER trigger_update_ai_usage_stats
--     AFTER INSERT ON ai_audit_logs
--     FOR EACH ROW
--     EXECUTE FUNCTION update_ai_usage_stats();

-- ============================================
-- Initial data: No initial data needed
-- ============================================

