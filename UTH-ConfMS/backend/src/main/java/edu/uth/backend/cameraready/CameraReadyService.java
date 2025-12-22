package edu.uth.backend.cameraready;

import edu.uth.backend.common.FileStorageUtil;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.PaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
public class CameraReadyService {

    @Autowired
    private PaperRepository paperRepo;

    @Autowired
    private FileStorageUtil fileStorageUtil;

    public Paper submitCameraReady(Long paperId, MultipartFile file) {

        // 1. Tìm paper
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo"));

        // 2. Chỉ ACCEPTED mới được nộp
        if (paper.getStatus() != PaperStatus.ACCEPTED) {
            throw new RuntimeException("Chỉ bài ACCEPTED mới được nộp camera-ready");
        }

        // 3. Check deadline
        Conference conf = paper.getTrack().getConference();
        if (conf.getCameraReadyDeadline() != null &&
                LocalDateTime.now().isAfter(conf.getCameraReadyDeadline())) {
            throw new RuntimeException("Đã quá hạn nộp camera-ready");
        }

        // 4. Validate file
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File không được để trống");
        }

        if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Chỉ chấp nhận file PDF");
        }

        // 5. Không cho nộp lại
        if (paper.getCameraReadyPath() != null) {
            throw new RuntimeException("Bài báo đã nộp camera-ready rồi");
        }

        // 6. Lưu file
        String filePath = fileStorageUtil.saveFile(file, "camera-ready");

        // 7. Cập nhật DB
        paper.setCameraReadyPath(filePath);

        return paperRepo.save(paper);
    }
}
