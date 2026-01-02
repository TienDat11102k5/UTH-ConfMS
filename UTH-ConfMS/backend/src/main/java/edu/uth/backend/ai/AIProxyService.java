package edu.uth.backend.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.ai.dto.*;
import edu.uth.backend.entity.AIAuditLog;
import edu.uth.backend.entity.AIFeatureFlag;
import edu.uth.backend.repository.AIAuditLogRepository;
import edu.uth.backend.repository.AIFeatureFlagRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dịch vụ tương tác với Google Gemini AI.
 * Xử lý các yêu cầu AI, lưu bộ nhớ đệm (caching), định danh đầu vào và ghi nhật
 * ký kiểm toán (audit logging).
 */
@Service
public class AIProxyService {

    private static final Logger logger = LoggerFactory.getLogger(AIProxyService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final AIAuditLogRepository auditLogRepository;
    private final AIFeatureFlagRepository featureFlagRepository;

    // Bộ nhớ đệm (Cache)
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

    @Value("${app.ai.gemini.key}")
    private String geminiKey;

    @Value("${app.ai.gemini.url}")
    private String geminiUrl;

    @Value("${app.ai.service.timeout:30000}")
    private int timeoutMs;

    @Value("${app.ai.service.retry.max-attempts:3}")
    private int maxRetries;

    @Value("${app.ai.service.cache.enabled:true}")
    private boolean cacheEnabled;

    public AIProxyService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper,
            AIAuditLogRepository auditLogRepository, AIFeatureFlagRepository featureFlagRepository) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.auditLogRepository = auditLogRepository;
        this.featureFlagRepository = featureFlagRepository;
    }

    // =================================================================================
    // Tính năng dành cho Tác giả (Author)
    // =================================================================================

    public GrammarCheckResponse checkGrammar(GrammarCheckRequest request, Long userId) {
        checkFeatureEnabled(request.getConferenceId(), "grammar_check");

        String prompt = String.format(
                "You are a Vietnamese academic writing assistant. " +
                        "Check grammar and spelling for the following text (%s). " +
                        "CRITICAL RULES: " +
                        "1. If input is in VIETNAMESE, all error messages MUST be in VIETNAMESE. " +
                        "2. If input is in ENGLISH, all error messages MUST be in ENGLISH. " +
                        "3. NEVER translate the text. Keep it in the SAME language. " +
                        "4. The 'message' field in errors MUST be in the SAME language as the input. " +
                        "Return a JSON object with: " +
                        "'correctedText' (string in the SAME language), 'errors' (list of objects with 'message' in SAME language, 'offset' (int), 'length' (int), 'replacements' (list of strings)). "
                        +
                        "Do not change the meaning. " +
                        "Text: \"\"\"%s\"\"\"",
                request.getFieldName(), request.getText());

        return processRequest(prompt, new TypeReference<GrammarCheckResponse>() {
        },
                "grammar_check", "check_grammar", userId, request.getConferenceId());
    }

    public PolishResponse polishContent(PolishRequest request, Long userId) {
        checkFeatureEnabled(request.getConferenceId(), "polish_content");

        String prompt = String.format(
                "You are a Vietnamese academic writing assistant. " +
                        "Polish the following text to make it more academic, professional, and clear. field: %s. " +
                        "CRITICAL RULES: " +
                        "1. If input is in VIETNAMESE, output MUST be 100%% VIETNAMESE (including all explanations). " +
                        "2. If input is in ENGLISH, output MUST be 100%% ENGLISH. " +
                        "3. NEVER mix languages. NEVER translate. " +
                        "4. The 'comment' field MUST be in the SAME language as the input text. " +
                        "Return a JSON object with: " +
                        "'originalText' (the input text), 'polishedText' (the improved version in the SAME language), and 'comment' (explanation in the SAME language as input). "
                        +
                        "Text: \"\"\"%s\"\"\"",
                request.getType(), request.getContent());

        return processRequest(prompt, new TypeReference<PolishResponse>() {
        },
                "polish_content", "polish", userId, request.getConferenceId());
    }

    public KeywordSuggestionResponse suggestKeywords(KeywordSuggestionRequest request, Long userId) {
        checkFeatureEnabled(request.getConferenceId(), "keyword_suggestion");

        String prompt = String.format(
                "You are a Vietnamese academic writing assistant. " +
                        "Suggest %d academic keywords for a paper with the following Title and Abstract. " +
                        "CRITICAL RULES: " +
                        "1. If input is in VIETNAMESE, keywords MUST be in VIETNAMESE. " +
                        "2. If input is in ENGLISH, keywords MUST be in ENGLISH. " +
                        "3. NEVER translate keywords. Use the SAME language as the input. " +
                        "Return a JSON object with 'keywords' (list of strings in the SAME language as input). " +
                        "Title: \"%s\" " +
                        "Abstract: \"%s\"",
                request.getMaxKeywords(), request.getTitle(), request.getAbstractText());

        return processRequest(prompt, new TypeReference<KeywordSuggestionResponse>() {
        },
                "keyword_suggestion", "suggest_keywords", userId, request.getConferenceId());
    }

    // =================================================================================
    // Tính năng dành cho Người phản biện / Thành viên Hội đồng (Reviewer/PC Member)
    // =================================================================================

    public PaperSynopsisResponse generatePaperSynopsis(PaperSynopsisRequest request, Long userId, Long conferenceId) {
        checkFeatureEnabled(conferenceId, "paper_synopsis");

        String prompt = String.format(
                "Generate a detailed synopsis for the following research paper. " +
                        "Language: %s. Length: %s. " +
                        "Title: \"%s\" " +
                        "Abstract: \"%s\" " +
                        "Return a JSON object with strictly these fields: " +
                        "'synopsis' (neutral summary, 150-250 words), " +
                        "'keyThemes' (list of strings), " +
                        "'methodology' (string), " +
                        "'claims' (list of key claims), " +
                        "'datasets' (list of datasets used), " +
                        "'contributionType' (string), " +
                        "'wordCount' (integer estimated). " +
                        "Ensure anonymity (double-blind).",
                request.getLanguage(), request.getLength(), request.getTitle(), request.getAbstractText());

        return processRequest(prompt, new TypeReference<PaperSynopsisResponse>() {
        },
                "paper_synopsis", "generate_synopsis", userId, conferenceId);
    }

    // =================================================================================
    // Tính năng dành cho Trưởng ban / Trưởng tiểu ban (Chair/Track Chair)
    // =================================================================================

    public ReviewerSimilarityResponse calculateReviewerSimilarity(ReviewerSimilarityRequest request, Long userId,
            Long conferenceId) {
        checkFeatureEnabled(conferenceId, "reviewer_similarity");

        // Serialize danh sách thành chuỗi cho prompt
        String reviewersJson = "";
        try {
            reviewersJson = objectMapper.writeValueAsString(request.getReviewers());
        } catch (Exception e) {
            reviewersJson = request.getReviewers().toString();
        }

        String prompt = String.format(
                "Rate the relevance of the following reviewers for the paper titled \"%s\". " +
                        "Paper Keywords: %s. " +
                        "Reviewers Data: %s. " +
                        "Return a JSON object with: " +
                        "'similarityScores' (map of reviewerId -> integer 0-100), " +
                        "'reasoning' (map of reviewerId -> string reason). " +
                        "Explain validation based on keyword overlap.",
                request.getPaperTitle(), request.getPaperKeywords(), reviewersJson);

        return processRequest(prompt, new TypeReference<ReviewerSimilarityResponse>() {
        },
                "reviewer_similarity", "calculate_similarity", userId, conferenceId);
    }

    public AssignmentSuggestionResponse suggestAssignments(AssignmentSuggestionRequest request, Long userId,
            Long conferenceId) {
        checkFeatureEnabled(conferenceId, "assignment_suggestion");

        String prompt = String.format(
                "Suggest paper-reviewer assignments. " +
                        "Constraints: %s. " +
                        "Paper IDs: %s. " +
                        "Reviewer IDs: %s. " +
                        "Papers Metadata: %s. " +
                        "Reviewers Metadata: %s. " +
                        "Return a JSON object with 'assignments' (list of objects with 'paperId', 'reviewerId', 'reason').",
                request.getConstraints(), request.getPaperIds(), request.getReviewerIds(),
                request.getPapersMetadata(), request.getReviewersMetadata());

        return processRequest(prompt, new TypeReference<AssignmentSuggestionResponse>() {
        },
                "assignment_suggestion", "suggest_assignments", userId, conferenceId);
    }

    public SinglePaperAssignmentResponse suggestReviewersForPaper(SinglePaperAssignmentRequest request, Long userId,
            Long conferenceId) {
        checkFeatureEnabled(conferenceId, "assignment_suggestion");

        String reviewersJson = "";
        try {
            reviewersJson = objectMapper.writeValueAsString(request.getAvailableReviewers());
        } catch (Exception e) {
            reviewersJson = request.getAvailableReviewers().toString();
        }

        String keywordsStr = request.getPaperKeywords() != null ? String.join(", ", request.getPaperKeywords()) : "";

        String prompt = String.format(
                "Bạn là trợ lý AI cho hội nghị khoa học. Gợi ý những reviewer phù hợp nhất cho bài báo sau. " +
                        "Bài báo: \"%s\". " +
                        "Tóm tắt: \"%s\". " +
                        "Từ khóa: %s. " +
                        "Danh sách reviewer khả dụng: %s. " +
                        "LƯU Ý: " +
                        "- Thông tin reviewer có thể giới hạn (chỉ có tên, email, affiliation, bio). " +
                        "- Nếu không có đủ thông tin, hãy phân tích dựa trên affiliation và bio. " +
                        "- Nếu thực sự không có thông tin gì, hãy đánh giá similarity thấp (0.3-0.5) và giải thích rõ. " +
                        "QUAN TRỌNG: " +
                        "1. Xếp hạng reviewer theo độ phù hợp (similarity score từ 0.0 đến 1.0). " +
                        "2. Ưu tiên reviewer có expertise và keywords trùng khớp với bài báo. " +
                        "3. Trả lời 100%% bằng TIẾNG VIỆT. " +
                        "Trả về JSON với: " +
                        "'suggestions' (danh sách các object với 'reviewerId' (số nguyên), 'reviewerName' (chuỗi), 'similarityScore' (số thực 0.0-1.0), 'rationale' (giải thích ngắn gọn bằng tiếng Việt)), " +
                        "'explanation' (giải thích tổng quan về cách chọn bằng tiếng Việt).",
                request.getPaperTitle(), 
                request.getPaperAbstract() != null ? request.getPaperAbstract() : "", 
                keywordsStr, 
                reviewersJson);

        return processRequest(prompt, new TypeReference<SinglePaperAssignmentResponse>() {
        },
                "assignment_suggestion", "suggest_reviewers_for_paper", userId, conferenceId);
    }

    public EmailDraftResponse draftEmail(EmailDraftRequest request, Long userId, Long conferenceId) {
        checkFeatureEnabled(conferenceId, "email_draft");

        String prompt = String.format(
                "Draft a professional email for a conference management system. " +
                        "Type: %s. Recipient: %s. Paper: %s. Conference: %s. Decision: %s. Comments: %s. Language: %s. "
                        +
                        "Return a JSON object with: " +
                        "'subject' (string), " +
                        "'body' (string, may contain HTML), " +
                        "'language' (string).",
                request.getEmailType(), request.getRecipientName(), request.getPaperTitle(),
                request.getConferenceName(), request.getDecision(), request.getComments(), request.getLanguage());

        return processRequest(prompt, new TypeReference<EmailDraftResponse>() {
        },
                "email_draft", "draft_email", userId, conferenceId);
    }

    public DecisionRecommendationResponse recommendDecision(DecisionRecommendationRequest request, Long userId, Long conferenceId) {
        checkFeatureEnabled(conferenceId, "decision_recommendation");

        String reviewsJson = "";
        try {
            reviewsJson = objectMapper.writeValueAsString(request.getReviews());
        } catch (Exception e) {
            reviewsJson = request.getReviews().toString();
        }

        String prompt = String.format(
                "Bạn là trợ lý AI cho hội nghị khoa học. Phân tích các đánh giá sau và đưa ra gợi ý quyết định. " +
                        "Bài báo: \"%s\". " +
                        "Điểm trung bình: %.2f (thang điểm từ -3 đến +3, trong đó -3 là rất kém, 0 là trung bình, +3 là xuất sắc). " +
                        "Các đánh giá: %s. " +
                        "QUAN TRỌNG: Trả lời 100%% bằng TIẾNG VIỆT. " +
                        "Trả về JSON với: " +
                        "'recommendation' (chuỗi: ACCEPT nếu điểm >= 1, REJECT nếu điểm < 0, REVISE nếu 0-1), " +
                        "'confidence' (số nguyên 0-100), " +
                        "'reasoning' (giải thích chi tiết bằng tiếng Việt, 2-3 câu), " +
                        "'strengths' (danh sách 2-4 điểm mạnh bằng tiếng Việt), " +
                        "'weaknesses' (danh sách 2-4 điểm yếu bằng tiếng Việt), " +
                        "'summary' (tóm tắt ngắn gọn 1-2 câu bằng tiếng Việt).",
                request.getPaperTitle(), request.getAverageScore(), reviewsJson);

        return processRequest(prompt, new TypeReference<DecisionRecommendationResponse>() {
        },
                "decision_recommendation", "recommend_decision", userId, conferenceId);
    }

    public ReviewSummaryResponse summarizeReviews(ReviewSummaryRequest request, Long userId, Long conferenceId) {
        checkFeatureEnabled(conferenceId, "review_summary");

        String reviewsJson = "";
        try {
            reviewsJson = objectMapper.writeValueAsString(request.getReviews());
        } catch (Exception e) {
            reviewsJson = request.getReviews().toString();
        }

        String prompt = String.format(
                "Bạn là trợ lý AI cho hội nghị khoa học. Tóm tắt các đánh giá sau cho bài báo \"%s\". " +
                        "Các đánh giá: %s. " +
                        "QUAN TRỌNG: Trả lời 100%% bằng TIẾNG VIỆT. " +
                        "Trả về JSON với: " +
                        "'overallSummary' (tóm tắt tổng quan 2-3 câu bằng tiếng Việt), " +
                        "'commonStrengths' (danh sách điểm mạnh chung bằng tiếng Việt), " +
                        "'commonWeaknesses' (danh sách điểm yếu chung bằng tiếng Việt), " +
                        "'keyPoints' (danh sách các điểm quan trọng bằng tiếng Việt), " +
                        "'consensus' (mô tả mức độ đồng thuận giữa các reviewer bằng tiếng Việt).",
                request.getPaperTitle(), reviewsJson);

        return processRequest(prompt, new TypeReference<ReviewSummaryResponse>() {
        },
                "review_summary", "summarize_reviews", userId, conferenceId);
    }

    // =================================================================================
    // Logic nội bộ
    // =================================================================================

    private void checkFeatureEnabled(Long conferenceId, String featureName) {
        if (conferenceId == null) {
            logger.debug("Bỏ qua kiểm tra feature flag vì conferenceId = null");
            return; // Bỏ qua kiểm tra nếu không có ngữ cảnh hội nghị
        }
        
        Optional<AIFeatureFlag> flag = featureFlagRepository.findByConferenceIdAndFeatureName(conferenceId,
                featureName);
        
        // Default: DISABLED (phải bật rõ ràng mới được dùng)
        if (!flag.isPresent() || !flag.get().isEnabled()) {
            throw new RuntimeException(
                "Tính năng AI này hiện đang tắt cho hội nghị. " +
                "Vui lòng liên hệ quản trị viên để được hỗ trợ."
            );
        }
        
        logger.debug("Feature {} enabled for conference {}", featureName, conferenceId);
    }

    private <T> T processRequest(String prompt, TypeReference<T> responseType,
            String feature, String action, Long userId, Long conferenceId) {
        String inputHash = hashInput(prompt);

        // Kiểm tra Cache
        String cacheKey = "GEMINI:" + inputHash;
        if (cacheEnabled) {
            CacheEntry cached = cache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                logger.debug("Cache hit cho input hash: {}", inputHash);
                try {
                    T result = objectMapper.convertValue(cached.getValue(), responseType);
                    logAudit(userId, conferenceId, feature, action, prompt, inputHash, result, true);
                    return result;
                } catch (Exception e) {
                    // tiếp tục nếu lỗi
                }
            }
        }

        // Gọi Gemini
        T result = callGemini(prompt, responseType);

        // Cache và Ghi log
        if (cacheEnabled && result != null) {
            cache.put(cacheKey, new CacheEntry(result, System.currentTimeMillis()));
        }
        logAudit(userId, conferenceId, feature, action, prompt, inputHash, result, false);

        return result;
    }

    private <T> T callGemini(String promptText, TypeReference<T> responseType) {
        logger.info("Calling Gemini API with prompt length: {}", promptText.length());
        logger.debug("Gemini URL: {}", geminiUrl);
        logger.debug("API Key present: {}", geminiKey != null && !geminiKey.isEmpty());
        
        // Xây dựng yêu cầu Gemini
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(
                Map.of("parts", Collections.singletonList(Map.of("text", promptText)))));
        requestBody.put("generationConfig", Map.of("response_mime_type", "application/json"));

        try {
            String responseJson = webClient.post()
                    .uri(geminiUrl + "?key=" + geminiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .retryWhen(Retry.fixedDelay(maxRetries, Duration.ofSeconds(1))
                            .filter(t -> t instanceof WebClientResponseException
                                    && ((WebClientResponseException) t).getStatusCode().is5xxServerError()))
                    .block();

            logger.debug("Gemini response received, length: {}", responseJson != null ? responseJson.length() : 0);

            // Phân tích phản hồi từ Gemini
            Map<String, Object> rootNode = objectMapper.readValue(responseJson,
                    new TypeReference<Map<String, Object>>() {
                    });

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) rootNode.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Không có ứng viên (candidates) nào được trả về từ Gemini");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String textResponse = (String) parts.get(0).get("text");

            // Làm sạch markdown
            if (textResponse.startsWith("```json")) {
                textResponse = textResponse.replace("```json", "").replace("```", "");
            } else if (textResponse.startsWith("```")) {
                textResponse = textResponse.replace("```", "");
            }

            return objectMapper.readValue(textResponse, responseType);

        } catch (Exception e) {
            logger.error("Lỗi khi gọi API Gemini", e);
            throw new RuntimeException("Xử lý yêu cầu AI thất bại: " + e.getMessage(), e);
        }
    }

    private void logAudit(Long userId, Long conferenceId, String feature, String action,
            String prompt, String inputHash, Object result, boolean fromCache) {
        try {
            String outputSummary = objectMapper.writeValueAsString(result);
            if (outputSummary.length() > 5000)
                outputSummary = outputSummary.substring(0, 5000) + "...";
            String promptTrunc = prompt.length() > 5000 ? prompt.substring(0, 5000) + "..." : prompt;

            AIAuditLog log = AIAuditLog.builder()
                    .userId(userId)
                    .conferenceId(conferenceId)
                    .feature(feature)
                    .action(action)
                    .prompt(promptTrunc)
                    .inputHash(inputHash)
                    .modelId("gemini-2.5-flash")
                    .outputSummary(outputSummary)
                    .accepted(null) // Chờ người dùng chấp nhận
                    .metadata(fromCache ? "{\"cache_hit\": true}" : "{\"cache_hit\": false}")
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Không thể lưu nhật ký kiểm toán AI", e);
        }
    }

    private String hashInput(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    private static class CacheEntry {
        private final Object value;
        private final long timestamp;

        public CacheEntry(Object value, long timestamp) {
            this.value = value;
            this.timestamp = timestamp;
        }

        public Object getValue() {
            return value;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}
