package edu.uth.backend.ai;

import edu.uth.backend.ai.dto.*;
import edu.uth.backend.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIProxyService aiProxyService;
    private final edu.uth.backend.submission.SubmissionService submissionService;

    @Autowired
    public AIController(AIProxyService aiProxyService, edu.uth.backend.submission.SubmissionService submissionService) {
        this.aiProxyService = aiProxyService;
        this.submissionService = submissionService;
    }

    // --- Tác giả (Author) ---
    @PostMapping("/grammar-check")
    public ResponseEntity<GrammarCheckResponse> checkGrammar(
            @RequestBody GrammarCheckRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity.ok(aiProxyService.checkGrammar(request, userId));
    }

    @PostMapping("/polish")
    public ResponseEntity<PolishResponse> polishContent(
            @RequestBody PolishRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity.ok(aiProxyService.polishContent(request, userId));
    }

    @PostMapping("/suggest-keywords")
    public ResponseEntity<KeywordSuggestionResponse> suggestKeywords(
            @RequestBody KeywordSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity.ok(aiProxyService.suggestKeywords(request, userId));
    }

    // --- Người phản biện / Thành viên Hội đồng (Reviewer / PC Member) ---
    @PostMapping("/synopsis")
    @PreAuthorize("hasAnyRole('REVIEWER', 'CHAIR', 'TRACK_CHAIR', 'AUTHOR')") // Reviewer sử dụng mục này, có thể cả
                                                                              // Author? Yêu cầu ghi "Dành cho
                                                                              // Reviewer/PC Member"
    public ResponseEntity<PaperSynopsisResponse> generatePaperSynopsis(
            @RequestBody PaperSynopsisRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        // ConferenceId bắt buộc phải có trong request
        return ResponseEntity.ok(aiProxyService.generatePaperSynopsis(request, userId, request.getConferenceId()));
    }

    // --- Trưởng ban / Trưởng tiểu ban (Chair / Track Chair) ---
    @PostMapping("/reviewer-similarity")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<ReviewerSimilarityResponse> calculateReviewerSimilarity(
            @RequestBody ReviewerSimilarityRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity
                .ok(aiProxyService.calculateReviewerSimilarity(request, userId, request.getConferenceId()));
    }

    @PostMapping("/assignments-suggestion")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<AssignmentSuggestionResponse> suggestAssignments(
            @RequestBody AssignmentSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity.ok(aiProxyService.suggestAssignments(request, userId, request.getConferenceId()));
    }

    @PostMapping("/draft-email")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<EmailDraftResponse> draftEmail(
            @RequestBody EmailDraftRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        return ResponseEntity.ok(aiProxyService.draftEmail(request, userId, request.getConferenceId()));
    }

    // --- Cập nhật kết quả AI (Apply Changes) ---
    @PostMapping("/apply-polish")
    public ResponseEntity<?> applyPolish(
            @RequestBody ApplyPolishRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (!request.isUserConfirmed()) {
            return ResponseEntity.badRequest().body("Người dùng chưa xác nhận thay đổi.");
        }
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            submissionService.updatePaperAbstract(request.getPaperId(), request.getPolishedAbstract(), userId);

            // Log audit hành động apply?
            // Có thể thêm log "APPLY_POLISH" vào aiProxyService nếu cần.

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật abstract: " + e.getMessage());
        }
    }
}
