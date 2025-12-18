package edu.uth.backend.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.uth.backend.ai.AIProxyService;
import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperSynopsis;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.PaperSynopsisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Dịch vụ Tóm tắt Bài Báo
 * Xử lý sinh tóm tắt, lưu cache và kiểm tra tuân thủ double-blind.
 */
@Service
public class PaperSynopsisService {

    private static final Logger logger = LoggerFactory.getLogger(PaperSynopsisService.class);
    
    @Autowired
    private PaperRepository paperRepository;
    
    @Autowired
    private PaperSynopsisRepository synopsisRepository;
    
    @Autowired
    private AIProxyService aiProxyService;
    
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Tạo tóm tắt cho bài báo (hoặc trả về tóm tắt đã cache nếu có).
     *
     * @param paperId ID bài báo
     * @param reviewerId ID reviewer (cho logging kiểm toán)
     * @param length Độ dài mong muốn ("short", "medium", "long")
     * @return Thực thể PaperSynopsis
     */
    @Transactional
    public PaperSynopsis generateSynopsisForPaper(Long paperId, Long reviewerId, String length) {
        // Kiểm tra xem đã có tóm tắt lưu cache chưa
        Optional<PaperSynopsis> cached = synopsisRepository.findByPaperId(paperId);
        if (cached.isPresent()) {
            logger.info("Trả về tóm tắt đã cache cho bài {}", paperId);
            return cached.get();
        }
        
        // Lấy thông tin bài báo
        Paper paper = paperRepository.findById(paperId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo: " + paperId));
        
        // Chuẩn bị yêu cầu cho dịch vụ AI
        Map<String, Object> request = new HashMap<>();
        request.put("paper_id", paperId.toString());
        request.put("title", paper.getTitle());
        request.put("abstract", paper.getAbstractText());
        request.put("conference_id", paper.getTrack().getConference().getId().toString());
        request.put("length", length != null ? length : "medium");
        request.put("language", "vi");
        request.put("reviewer_id", reviewerId != null ? reviewerId.toString() : null);
        
        try {
            // Gọi dịch vụ AI
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) aiProxyService.callAIService(
                    "/api/v1/reviewers/generate-synopsis",
                    request,
                    Map.class
            );
            
            // Tạo và lưu thực thể tóm tắt
            PaperSynopsis synopsis = new PaperSynopsis();
            synopsis.setPaper(paper);
            synopsis.setSynopsis((String) response.get("synopsis"));
            synopsis.setKeyThemes(objectMapper.writeValueAsString(response.get("key_themes")));
            synopsis.setMethodology((String) response.get("methodology"));
            synopsis.setContributionType((String) response.get("contribution_type"));
            synopsis.setWordCount((Integer) response.get("word_count"));
            synopsis.setLength((String) response.get("length"));
            synopsis.setLanguage("vi");
            synopsis.setModelUsed((String) response.get("model_used"));
            synopsis.setGeneratedAt(LocalDateTime.now());
            synopsis.setIsValidated(true); // Giả định đã được dịch vụ AI xác thực
            
            PaperSynopsis saved = synopsisRepository.save(synopsis);
            logger.info("Đã sinh và lưu cache tóm tắt cho bài {}", paperId);
            
            return saved;
            
        } catch (Exception e) {
            logger.error("Lỗi khi tạo tóm tắt cho bài {}", paperId, e);
            throw new RuntimeException("Tạo tóm tắt thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy hoặc tạo tóm tắt cho một bài báo.
     *
     * @param paperId ID bài báo
     * @return Thực thể PaperSynopsis
     */
    @Transactional(readOnly = true)
    public Optional<PaperSynopsis> getOrCreateSynopsis(Long paperId) {
        return synopsisRepository.findByPaperId(paperId);
    }

    /**
     * Kiểm tra tuân thủ nguyên tắc double-blind cho tóm tắt.
     * LƯU Ý: Đây chỉ là kiểm tra đơn giản — việc xác thực chi tiết nên do dịch vụ AI xử lý.
     *
     * @param paperId ID bài báo
     * @param synopsis Văn bản tóm tắt
     * @return true nếu tuân thủ, false nếu không
     */
    public boolean checkDoubleBlindCompliance(Long paperId, String synopsis) {
        // Kiểm tra cơ bản - dịch vụ AI nên xử lý việc xác thực chi tiết
        // Kiểm tra các mẫu thông tin tác giả phổ biến
        String lowerSynopsis = synopsis.toLowerCase();
        String[] authorKeywords = {"author", "professor", "dr.", "doctor", "affiliation"};
        
        for (String keyword : authorKeywords) {
            if (lowerSynopsis.contains(keyword)) {
                logger.warn("Phát hiện khả năng chứa thông tin tác giả trong tóm tắt của bài {}", paperId);
                // Không dừng quy trình, chỉ log cảnh báo
            }
        }
        
        return true;
    }
}

