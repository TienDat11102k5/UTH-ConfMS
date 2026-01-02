-- Script để bật tất cả tính năng AI cho hội nghị
-- Thay đổi conference_id = 1 thành ID hội nghị của bạn

-- Xóa các records cũ (nếu có)
DELETE FROM ai_feature_flags WHERE conference_id = 1;

-- Bật tất cả 9 tính năng AI
INSERT INTO ai_feature_flags (conference_id, feature_name, enabled, updated_at) VALUES
(1, 'grammar_check', true, NOW()),           -- Author: Kiểm tra ngữ pháp
(1, 'polish_content', true, NOW()),          -- Author: Đánh bóng nội dung
(1, 'keyword_suggestion', true, NOW()),      -- Author: Gợi ý từ khóa
(1, 'paper_synopsis', true, NOW()),          -- Reviewer: Tóm tắt bài báo
(1, 'reviewer_similarity', true, NOW()),     -- Chair: Độ tương đồng reviewer
(1, 'assignment_suggestion', true, NOW()),   -- Chair: Gợi ý phân công
(1, 'decision_recommendation', true, NOW()), -- Chair: Gợi ý quyết định
(1, 'review_summary', true, NOW()),          -- Chair: Tóm tắt review
(1, 'email_draft', true, NOW());             -- Chair: Soạn email

-- Kiểm tra kết quả
SELECT * FROM ai_feature_flags WHERE conference_id = 1 ORDER BY feature_name;
