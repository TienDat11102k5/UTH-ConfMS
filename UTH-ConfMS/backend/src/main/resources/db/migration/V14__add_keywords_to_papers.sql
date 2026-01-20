-- V14: Add keywords column to papers table
ALTER TABLE papers ADD COLUMN IF NOT EXISTS keywords TEXT;

COMMENT ON COLUMN papers.keywords IS 'Từ khóa của bài báo (phân tách bằng dấu chấm phẩy hoặc dấu phẩy)';
