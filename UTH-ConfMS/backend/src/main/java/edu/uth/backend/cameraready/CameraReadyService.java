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

    @Autowired private PaperRepository paperRepo;
    @Autowired private FileStorageUtil fileStorageUtil; 

    public Paper submitCameraReady(Long paperId, MultipartFile file) {
        // 1. Tìm bài báo
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài báo!"));

        // 2. CHECK QUAN TRỌNG: Chỉ bài được chấp nhận mới được nộp Camera Ready 
        if (paper.getStatus() != PaperStatus.ACCEPTED) {
            throw new RuntimeException("Lỗi: Bài báo chưa được chấp nhận (ACCEPTED), không thể nộp bản hoàn thiện!");
        }

        // 3. Validate file
        if (file.isEmpty()) throw new RuntimeException("File không được để trống!");

        // 4. (Optional) Check Deadline Camera Ready của Hội nghị 
        Conference conf = paper.getTrack().getConference();
        if (conf.getCameraReadyDeadline() != null && LocalDateTime.now().isAfter(conf.getCameraReadyDeadline())) {
             throw new RuntimeException("Đã quá hạn nộp bản hoàn thiện!");
        }
        
        // 5. Lưu file vào thư mục riêng "camera-ready"
        String fileName = fileStorageUtil.saveFile(file, "camera-ready");
        
        // 6. Cập nhật đường dẫn vào Database
        paper.setCameraReadyPath(fileName);

        return paperRepo.save(paper);
    }
}