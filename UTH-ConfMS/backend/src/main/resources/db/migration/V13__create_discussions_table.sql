-- V13__create_discussions_table.sql
-- Tạo bảng discussions cho tính năng thảo luận nội bộ PC

CREATE TABLE IF NOT EXISTS discussions (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES discussions(id) ON DELETE CASCADE,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes để tăng hiệu suất query
CREATE INDEX idx_discussions_paper_id ON discussions(paper_id);
CREATE INDEX idx_discussions_author_id ON discussions(author_id);
CREATE INDEX idx_discussions_parent_id ON discussions(parent_id);
CREATE INDEX idx_discussions_created_at ON discussions(created_at);

-- Comment để mô tả bảng
COMMENT ON TABLE discussions IS 'Bảng lưu trữ các thảo luận nội bộ PC về các bài báo';
COMMENT ON COLUMN discussions.paper_id IS 'ID của paper được thảo luận';
COMMENT ON COLUMN discussions.author_id IS 'ID của PC member đăng bình luận';
COMMENT ON COLUMN discussions.content IS 'Nội dung bình luận';
COMMENT ON COLUMN discussions.parent_id IS 'ID của comment cha (NULL nếu là comment gốc)';
COMMENT ON COLUMN discussions.is_visible IS 'Trạng thái hiển thị (có thể ẩn comment)';
