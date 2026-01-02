-- Xóa tất cả features cũ không còn dùng nữa
-- Chỉ giữ lại 9 features chính thức

-- Danh sách 9 features chính thức
-- grammar_check, polish_content, keyword_suggestion, paper_synopsis,
-- reviewer_similarity, assignment_suggestion, decision_recommendation,
-- review_summary, email_draft

-- Xóa features cũ
DELETE FROM ai_feature_flags 
WHERE feature_name NOT IN (
    'grammar_check',
    'polish_content',
    'keyword_suggestion',
    'paper_synopsis',
    'reviewer_similarity',
    'assignment_suggestion',
    'decision_recommendation',
    'review_summary',
    'email_draft'
);

-- Kiểm tra kết quả
SELECT conference_id, COUNT(*) as feature_count 
FROM ai_feature_flags 
GROUP BY conference_id 
ORDER BY conference_id;
