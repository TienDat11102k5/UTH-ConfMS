package edu.uth.backend.ai;

import lombok.extern.slf4j.Slf4j;
import edu.uth.backend.ai.dto.*;
import edu.uth.backend.security.CustomUserDetails;
import edu.uth.backend.submission.SubmissionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIProxyService aiProxyService;
    private final SubmissionService submissionService;

    public AIController(
            AIProxyService aiProxyService,
            SubmissionService submissionService
    ) {
        this.aiProxyService = aiProxyService;
        this.submissionService = submissionService;
    }

    // ================= AUTHOR =================

    @PostMapping("/grammar-check")
    public ResponseEntity<GrammarCheckResponse> checkGrammar(
            @RequestBody GrammarCheckRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info("POST /api/ai/grammar-check | userId={}", userId);

        return ResponseEntity.ok(aiProxyService.checkGrammar(request, userId));
    }

    @PostMapping("/polish")
    public ResponseEntity<PolishResponse> polishContent(
            @RequestBody PolishRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info("POST /api/ai/polish | userId={}", userId);

        return ResponseEntity.ok(aiProxyService.polishContent(request, userId));
    }

    @PostMapping("/suggest-keywords")
    public ResponseEntity<KeywordSuggestionResponse> suggestKeywords(
            @RequestBody KeywordSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info("POST /api/ai/suggest-keywords | userId={}", userId);

        return ResponseEntity.ok(aiProxyService.suggestKeywords(request, userId));
    }

    // ================= REVIEWER / PC MEMBER =================

    @PostMapping("/synopsis")
    @PreAuthorize("hasAnyRole('REVIEWER', 'CHAIR', 'TRACK_CHAIR', 'AUTHOR')")
    public ResponseEntity<PaperSynopsisResponse> generatePaperSynopsis(
            @RequestBody PaperSynopsisRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/synopsis | userId={} | conferenceId={}",
                userId,
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.generatePaperSynopsis(request, userId, request.getConferenceId())
        );
    }

    // ================= CHAIR / TRACK CHAIR =================

    @PostMapping("/reviewer-similarity")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<ReviewerSimilarityResponse> calculateReviewerSimilarity(
            @RequestBody ReviewerSimilarityRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/reviewer-similarity | userId={} | conferenceId={}",
                userId,
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.calculateReviewerSimilarity(request, userId, request.getConferenceId())
        );
    }

    @PostMapping("/assignments-suggestion")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<AssignmentSuggestionResponse> suggestAssignments(
            @RequestBody AssignmentSuggestionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/assignments-suggestion | userId={} | conferenceId={}",
                userId,
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.suggestAssignments(request, userId, request.getConferenceId())
        );
    }

    @PostMapping("/recommend-decision")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<DecisionRecommendationResponse> recommendDecision(
            @RequestBody DecisionRecommendationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/recommend-decision | userId={} | paperId={} | conferenceId={}",
                userId,
                request.getPaperId(),
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.recommendDecision(request, userId, request.getConferenceId())
        );
    }

    @PostMapping("/summarize-reviews")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<ReviewSummaryResponse> summarizeReviews(
            @RequestBody ReviewSummaryRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/summarize-reviews | userId={} | paperId={} | conferenceId={}",
                userId,
                request.getPaperId(),
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.summarizeReviews(request, userId, request.getConferenceId())
        );
    }

    @PostMapping("/draft-email")
    @PreAuthorize("hasAnyRole('CHAIR', 'TRACK_CHAIR')")
    public ResponseEntity<EmailDraftResponse> draftEmail(
            @RequestBody EmailDraftRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/draft-email | userId={} | conferenceId={}",
                userId,
                request.getConferenceId()
        );

        return ResponseEntity.ok(
                aiProxyService.draftEmail(request, userId, request.getConferenceId())
        );
    }

    // ================= APPLY AI RESULT =================

    @PostMapping("/apply-polish")
    public ResponseEntity<?> applyPolish(
            @RequestBody ApplyPolishRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUser().getId() : null;
        log.info(
                "POST /api/ai/apply-polish | userId={} | paperId={}",
                userId,
                request.getPaperId()
        );

        if (!request.isUserConfirmed()) {
            log.warn("Apply polish rejected: user not confirmed | userId={}", userId);
            return ResponseEntity.badRequest().body("Người dùng chưa xác nhận thay đổi.");
        }

        if (userId == null) {
            log.warn("Apply polish unauthorized");
            return ResponseEntity.status(401).body("Unauthorized");
        }

        submissionService.updatePaperAbstract(
                request.getPaperId(),
                request.getPolishedAbstract(),
                userId
        );

        log.info("Apply polish success | userId={} | paperId={}", userId, request.getPaperId());
        return ResponseEntity.ok().build();
    }
}
