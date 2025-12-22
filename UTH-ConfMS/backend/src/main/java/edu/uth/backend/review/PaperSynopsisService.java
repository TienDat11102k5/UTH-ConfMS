package edu.uth.backend.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.ai.dto.PaperSynopsisRequest;
import edu.uth.backend.ai.dto.PaperSynopsisResponse;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperSynopsis;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.PaperSynopsisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PaperSynopsisService {

    private static final Logger logger =
            LoggerFactory.getLogger(PaperSynopsisService.class);

    private final PaperRepository paperRepository;
    private final PaperSynopsisRepository synopsisRepository;
    private final AIProxyService aiProxyService;
    private final ObjectMapper objectMapper;

    // ✅ Constructor injection – KHÔNG cần @Autowired
    public PaperSynopsisService(
            PaperRepository paperRepository,
            PaperSynopsisRepository synopsisRepository,
            AIProxyService aiProxyService,
            ObjectMapper objectMapper
    ) {
        this.paperRepository = paperRepository;
        this.synopsisRepository = synopsisRepository;
        this.aiProxyService = aiProxyService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PaperSynopsis generateSynopsisForPaper(
            Long paperId,
            Long reviewerId,
            String length
    ) {
        Optional<PaperSynopsis> cached =
                synopsisRepository.findByPaperId(paperId);

        if (cached.isPresent()) {
            logger.info(
                    "Trả về tóm tắt đã cache cho bài {}",
                    paperId
            );
            return cached.get();
        }

        Paper paper = paperRepository.findById(paperId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy bài báo: " + paperId
                        )
                );

        Long conferenceId =
                paper.getTrack() != null &&
                paper.getTrack().getConference() != null
                        ? paper.getTrack().getConference().getId()
                        : null;

        PaperSynopsisRequest request =
                new PaperSynopsisRequest();

        request.setTitle(paper.getTitle());
        request.setAbstractText(paper.getAbstractText());
        request.setLength(length != null ? length : "medium");
        request.setLanguage("vi");
        request.setConferenceId(conferenceId);

        try {
            PaperSynopsisResponse response =
                    aiProxyService.generatePaperSynopsis(
                            request,
                            reviewerId,
                            conferenceId
                    );

            PaperSynopsis synopsis = new PaperSynopsis();
            synopsis.setPaper(paper);
            synopsis.setSynopsis(response.getSynopsis());
            synopsis.setKeyThemes(
                    objectMapper.writeValueAsString(
                            response.getKeyThemes()
                    )
            );
            synopsis.setClaims(
                    objectMapper.writeValueAsString(
                            response.getClaims()
                    )
            );
            synopsis.setDatasets(
                    objectMapper.writeValueAsString(
                            response.getDatasets()
                    )
            );
            synopsis.setMethodology(
                    response.getMethodology()
            );
            synopsis.setContributionType(
                    response.getContributionType()
            );
            synopsis.setWordCount(
                    response.getWordCount()
            );
            synopsis.setLength(length);
            synopsis.setLanguage("vi");
            synopsis.setModelUsed(
                    "gemini-1.5-flash"
            );
            synopsis.setGeneratedAt(
                    LocalDateTime.now()
            );
            synopsis.setIsValidated(true);

            PaperSynopsis saved =
                    synopsisRepository.save(synopsis);

            logger.info(
                    "Đã sinh và lưu cache tóm tắt cho bài {}",
                    paperId
            );

            return saved;

        } catch (Exception e) {
            logger.error(
                    "Lỗi khi tạo tóm tắt cho bài {}",
                    paperId,
                    e
            );
            throw new RuntimeException(
                    "Tạo tóm tắt thất bại: " + e.getMessage(),
                    e
            );
        }
    }

    @Transactional(readOnly = true)
    public Optional<PaperSynopsis> getOrCreateSynopsis(Long paperId) {
        return synopsisRepository.findByPaperId(paperId);
    }

    /**
     * Kiểm tra tuân thủ double-blind (đơn giản)
     */
    public boolean checkDoubleBlindCompliance(
            Long paperId,
            String synopsis
    ) {
        String lowerSynopsis = synopsis.toLowerCase();
        String[] authorKeywords = {
                "author",
                "professor",
                "dr.",
                "doctor",
                "affiliation"
        };

        for (String keyword : authorKeywords) {
            if (lowerSynopsis.contains(keyword)) {
                logger.warn(
                        "Phát hiện khả năng chứa thông tin tác giả trong tóm tắt của bài {}",
                        paperId
                );
            }
        }
        return true;
    }
}
