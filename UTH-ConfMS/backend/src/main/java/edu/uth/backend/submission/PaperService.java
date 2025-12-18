package edu.uth.backend.submission;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperStatus;
import edu.uth.backend.repository.PaperRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dịch vụ Bài Báo
 * Xử lý các thao tác liên quan đến bài báo, bao gồm cập nhật tóm tắt được hỗ trợ bởi AI.
 */
@Service
public class PaperService {

    private static final Logger logger = LoggerFactory.getLogger(PaperService.class);
    
    @Autowired
    private PaperRepository paperRepo;

    /**
        * Cập nhật tóm tắt bằng phiên bản đã được AI hiệu chỉnh.
        * Kiểm tra quyền của người dùng và ghi nhật ký thay đổi.
        *
        * @param paperId ID bài báo
        * @param polishedAbstract Văn bản tóm tắt đã được hiệu chỉnh
        * @param userId ID người dùng (phải là tác giả chính)
        * @return Thực thể Paper đã được cập nhật
        * @throws RuntimeException Nếu người dùng không có quyền hoặc bài báo không thể chỉnh sửa
     */
    @Transactional
    public Paper updateAbstractWithAI(Long paperId, String polishedAbstract, Long userId) {
        if (polishedAbstract == null || polishedAbstract.trim().isEmpty()) {
            throw new RuntimeException("Tóm tắt đã chỉnh sửa không được để trống");
        }
        
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo với ID: " + paperId));
        
        // Kiểm tra bảo mật: chỉ tác giả chính mới có quyền cập nhật
        if (!paper.getMainAuthor().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền cập nhật bài báo này");
        }
        
        // Kiểm tra bài báo có ở trạng thái có thể chỉnh sửa
        if (paper.getStatus() != PaperStatus.SUBMITTED) {
            throw new RuntimeException("Bài báo không ở trạng thái có thể sửa. Trạng thái hiện tại: " + paper.getStatus());
        }
        
        // Ghi nhật ký thay đổi (lưu tóm tắt gốc để ghi nhận kiểm toán)
        String originalAbstract = paper.getAbstractText();
        logger.info("Cập nhật tóm tắt cho bài {} bởi người dùng {}. Độ dài ban đầu: {}, Độ dài mới: {}", 
            paperId, userId, 
            originalAbstract != null ? originalAbstract.length() : 0, 
            polishedAbstract.length());
        
        // Cập nhật tóm tắt
        paper.setAbstractText(polishedAbstract);
        
        Paper updatedPaper = paperRepo.save(paper);
        
        logger.info("Đã cập nhật tóm tắt thành công cho bài {}", paperId);
        
        return updatedPaper;
    }
}


