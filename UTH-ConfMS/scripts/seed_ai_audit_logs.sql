-- Script để tạo dữ liệu mẫu cho AI Audit Logs
-- Chạy script này để test tính năng "Nhật ký sử dụng AI"

-- Insert sample audit logs cho các tính năng AI đã được bật
INSERT INTO ai_audit_logs (
    created_at, timestamp, conference_id, user_id, feature, action,
    prompt, model_id, input_hash, output_summary, accepted, metadata
) VALUES
-- Grammar Check logs
(
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    1,
    2,
    'grammar_check',
    'check_grammar',
    'This paper presents a novel approach to machine learning...',
    'gemini-1.5-flash',
    'abc123def456',
    'Đã tìm thấy 3 lỗi ngữ pháp: "presents" nên là "present", thiếu dấu phẩy sau "approach", "to" nên là "for"',
    true,
    '{"errors_found": 3, "corrections_applied": 3}'::jsonb
),
(
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour 30 minutes',
    1,
    3,
    'grammar_check',
    'check_grammar',
    'The experimental results shows significant improvement...',
    'gemini-1.5-flash',
    'def789ghi012',
    'Đã tìm thấy 1 lỗi: "shows" nên là "show" (chủ ngữ số nhiều)',
    true,
    '{"errors_found": 1, "corrections_applied": 1}'::jsonb
),

-- Polish Content logs
(
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    1,
    2,
    'polish_content',
    'polish_abstract',
    'This paper is about AI and machine learning stuff...',
    'gemini-1.5-flash',
    'ghi345jkl678',
    'Đã cải thiện văn phong: "This paper presents a comprehensive investigation of artificial intelligence and machine learning methodologies..."',
    true,
    '{"original_length": 52, "polished_length": 128, "improvement_score": 8.5}'::jsonb
),
(
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes',
    1,
    4,
    'polish_content',
    'polish_title',
    'AI for Healthcare',
    'gemini-1.5-flash',
    'jkl901mno234',
    'Đề xuất tiêu đề: "Artificial Intelligence Applications in Healthcare: A Comprehensive Review"',
    false,
    '{"original_length": 18, "polished_length": 78}'::jsonb
),

-- Keyword Suggestion logs
(
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    1,
    2,
    'keyword_suggestion',
    'suggest_keywords',
    'Abstract: This paper explores deep learning techniques for natural language processing...',
    'gemini-1.5-flash',
    'mno567pqr890',
    'Gợi ý từ khóa: Deep Learning, Natural Language Processing, Neural Networks, Text Classification, Transformer Models',
    true,
    '{"keywords_suggested": 5, "confidence_score": 0.92}'::jsonb
),
(
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes',
    1,
    3,
    'keyword_suggestion',
    'suggest_keywords',
    'Abstract: A study on blockchain technology and its applications in supply chain management...',
    'gemini-1.5-flash',
    'pqr123stu456',
    'Gợi ý từ khóa: Blockchain, Supply Chain Management, Distributed Ledger, Smart Contracts, Traceability',
    true,
    '{"keywords_suggested": 5, "confidence_score": 0.88}'::jsonb
),

-- Paper Synopsis logs (for reviewers)
(
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    1,
    5,
    'paper_synopsis',
    'generate_synopsis',
    'Full paper content about quantum computing applications...',
    'gemini-1.5-flash',
    'stu789vwx012',
    'Bài báo trình bày ứng dụng của điện toán lượng tử trong mật mã học. Điểm mạnh: Phương pháp mới, kết quả thực nghiệm tốt. Điểm yếu: Thiếu so sánh với các phương pháp hiện có.',
    true,
    '{"paper_length": 8500, "synopsis_length": 250, "reading_time_saved": "15 minutes"}'::jsonb
),

-- More recent logs
(
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes',
    1,
    2,
    'grammar_check',
    'check_grammar',
    'We propose a new algorithm for optimization problems...',
    'gemini-1.5-flash',
    'vwx345yza678',
    'Không tìm thấy lỗi ngữ pháp. Văn bản đã được viết tốt.',
    true,
    '{"errors_found": 0}'::jsonb
),
(
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes',
    1,
    4,
    'polish_content',
    'polish_abstract',
    'Our research focuses on improving neural network efficiency...',
    'gemini-1.5-flash',
    'yza901bcd234',
    'Đã cải thiện: "This research presents a systematic investigation into enhancing neural network computational efficiency through novel optimization techniques..."',
    true,
    '{"original_length": 62, "polished_length": 145, "improvement_score": 9.0}'::jsonb
);

-- Verify the inserted data
SELECT 
    id,
    timestamp,
    user_id,
    feature,
    action,
    LEFT(output_summary, 50) as summary_preview,
    accepted
FROM ai_audit_logs
WHERE conference_id = 1
ORDER BY timestamp DESC
LIMIT 10;
