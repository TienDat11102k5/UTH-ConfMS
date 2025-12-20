-- Migration: Create paper synopsis and feedback tables
-- Version: V11
-- Date: 2025-01-XX

-- Table: paper_synopses
CREATE TABLE IF NOT EXISTS paper_synopses (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL UNIQUE,
    synopsis TEXT NOT NULL,
    key_themes TEXT, -- JSON array
    claims TEXT, -- JSON array
    datasets TEXT, -- JSON array
    methodology VARCHAR(100),
    contribution_type VARCHAR(200),
    word_count INTEGER,
    length VARCHAR(20), -- "ngắn", "trung bình", "dài"
    language VARCHAR(10) DEFAULT 'en',
    model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
    generated_at TIMESTAMP WITH TIME ZONE,
    is_validated BOOLEAN DEFAULT false,
    validation_issues TEXT, -- JSON array
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_paper_synopses_paper_id ON paper_synopses(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_synopses_generated_at ON paper_synopses(generated_at DESC);

-- Table: synopsis_feedback
CREATE TABLE IF NOT EXISTS synopsis_feedback (
    id BIGSERIAL PRIMARY KEY,
    synopsis_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    issue TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (synopsis_id) REFERENCES paper_synopses(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_synopsis_feedback_synopsis_id ON synopsis_feedback(synopsis_id);
CREATE INDEX IF NOT EXISTS idx_synopsis_feedback_reviewer_id ON synopsis_feedback(reviewer_id);

COMMENT ON TABLE paper_synopses IS 'Tóm tắt do AI tạo cho các bài báo';
COMMENT ON TABLE synopsis_feedback IS 'Phản hồi từ reviewer về độ chính xác của tóm tắt';   




