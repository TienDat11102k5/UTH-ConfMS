package edu.uth.backend.proceedings;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperCoAuthor;
import edu.uth.backend.entity.PaperStatus;
import edu.uth.backend.proceedings.dto.ProceedingsDTO;
import edu.uth.backend.proceedings.dto.ProceedingsExportDTO;
import edu.uth.backend.proceedings.dto.ProgramSessionDTO;
import edu.uth.backend.proceedings.dto.ProgramPaperDTO;
import edu.uth.backend.repository.PaperRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProceedingsService {

    private static final Logger logger = LoggerFactory.getLogger(ProceedingsService.class);

    @Autowired private PaperRepository paperRepo;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<ProceedingsDTO> getConferenceProceedings(Long conferenceId) {
        logger.info("Fetching proceedings for conference ID: {}", conferenceId);
        
        // 1. Lấy tất cả bài ACCEPTED của hội nghị đó với eager loading
        List<Paper> acceptedPapers = paperRepo.findAllWithDetailsByConferenceIdAndStatus(
            conferenceId, 
            PaperStatus.ACCEPTED
        );

        logger.info("Found {} accepted papers for conference {}", acceptedPapers.size(), conferenceId);

        return convertToProceedingsDTO(acceptedPapers);
    }

    public List<ProceedingsDTO> getAllAcceptedProceedings() {
        logger.info("Fetching all accepted proceedings from all conferences");
        
        // Lấy tất cả bài ACCEPTED từ mọi hội nghị (kể cả bị ẩn)
        List<Paper> acceptedPapers = paperRepo.findAllWithDetailsByStatus(PaperStatus.ACCEPTED);
        
        logger.info("Found {} accepted papers from all conferences", acceptedPapers.size());
        
        return convertToProceedingsDTO(acceptedPapers);
    }

    private List<ProceedingsDTO> convertToProceedingsDTO(List<Paper> papers) {
        // 2. Chuyển đổi sang DTO
        return papers.stream().map(paper -> {
            // Lấy danh sách đồng tác giả
            String coAuthors = paper.getCoAuthors() != null 
                ? paper.getCoAuthors().stream()
                    .map(PaperCoAuthor::getName)
                    .collect(Collectors.joining(", "))
                : "";
            
            // Ưu tiên camera-ready, nếu không có thì dùng file gốc
            String pdfPath = paper.getCameraReadyPath() != null && !paper.getCameraReadyPath().isEmpty()
                ? paper.getCameraReadyPath()
                : paper.getFilePath();
            
            logger.debug("Paper {}: cameraReadyPath={}, filePath={}, using={}", 
                paper.getId(), paper.getCameraReadyPath(), paper.getFilePath(), pdfPath);
            
            return new ProceedingsDTO(
                paper.getId(),
                paper.getTrack().getName(),
                paper.getTitle(),
                paper.getMainAuthor().getFullName(),
                coAuthors,
                paper.getAbstractText(),
                pdfPath
            );
        }).collect(Collectors.toList());
    }

    public Resource getPaperFile(Long paperId) throws Exception {
        logger.info("Attempting to download paper ID: {}", paperId);
        
        Paper paper = paperRepo.findById(paperId)
                .orElseThrow(() -> new Exception("Paper not found with ID: " + paperId));
        
        logger.info("Paper found: {} (status: {})", paper.getTitle(), paper.getStatus());
        
        if (paper.getStatus() != PaperStatus.ACCEPTED) {
            throw new Exception("Paper is not accepted. Current status: " + paper.getStatus());
        }

        // Ưu tiên camera-ready, nếu không có thì dùng file gốc
        String filePath = paper.getCameraReadyPath() != null && !paper.getCameraReadyPath().isEmpty()
            ? paper.getCameraReadyPath() 
            : paper.getFilePath();
        
        logger.info("File path from database: {}", filePath);
        
        if (filePath == null || filePath.isEmpty()) {
            throw new Exception("No file available for this paper");
        }

        // Nếu path không bắt đầu bằng subfolder, thử thêm camera-ready/ hoặc submissions/
        Path path;
        if (filePath.contains("/") || filePath.contains("\\")) {
            // Path đã có subfolder
            path = Paths.get(uploadDir).resolve(filePath).normalize();
        } else {
            // Path không có subfolder, thử tìm trong camera-ready trước, sau đó submissions
            Path cameraReadyPath = Paths.get(uploadDir).resolve("camera-ready").resolve(filePath).normalize();
            Path submissionsPath = Paths.get(uploadDir).resolve("submissions").resolve(filePath).normalize();
            
            Resource cameraReadyResource = new UrlResource(cameraReadyPath.toUri());
            if (cameraReadyResource.exists() && cameraReadyResource.isReadable()) {
                path = cameraReadyPath;
                logger.info("File found in camera-ready folder");
            } else {
                Resource submissionsResource = new UrlResource(submissionsPath.toUri());
                if (submissionsResource.exists() && submissionsResource.isReadable()) {
                    path = submissionsPath;
                    logger.info("File found in submissions folder");
                } else {
                    // Fallback: thử path gốc
                    path = Paths.get(uploadDir).resolve(filePath).normalize();
                    logger.warn("File not found in subfolders, trying root path");
                }
            }
        }
        
        logger.info("Full file path: {}", path.toAbsolutePath());
        
        Resource resource = new UrlResource(path.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            logger.info("File found and readable: {}", resource.getFilename());
            return resource;
        } else {
            logger.error("File not found or not readable at path: {}", path.toAbsolutePath());
            throw new Exception("File not found or not readable: " + filePath);
        }
    }

    public ProceedingsExportDTO exportProceedingsData(Long conferenceId) {
        List<ProceedingsDTO> proceedings = getConferenceProceedings(conferenceId);
        
        return new ProceedingsExportDTO(
            conferenceId,
            proceedings.size(),
            proceedings
        );
    }

    public List<ProgramSessionDTO> getConferenceProgram(Long conferenceId) {
        logger.info("Generating program for conference ID: {}", conferenceId);
        
        // 1. Lấy tất cả bài ACCEPTED
        List<Paper> acceptedPapers = paperRepo.findAllWithDetailsByConferenceIdAndStatus(
            conferenceId, 
            PaperStatus.ACCEPTED
        );

        logger.info("Found {} accepted papers for program", acceptedPapers.size());

        // 2. Nhóm theo Track
        Map<String, List<Paper>> papersByTrack = acceptedPapers.stream()
            .collect(Collectors.groupingBy(paper -> paper.getTrack().getName()));

        // 3. Tạo sessions (mỗi track = 1 session)
        List<ProgramSessionDTO> sessions = papersByTrack.entrySet().stream()
            .map(entry -> {
                String trackName = entry.getKey();
                List<Paper> papers = entry.getValue();
                
                // Lấy Track object từ paper đầu tiên
                Paper firstPaper = papers.get(0);
                String sessionDate = firstPaper.getTrack().getSessionDate();
                String sessionTime = firstPaper.getTrack().getSessionTime();
                String room = firstPaper.getTrack().getRoom();
                String trackDescription = firstPaper.getTrack().getDescription();
                
                // Nếu không có description, dùng mặc định
                if (trackDescription == null || trackDescription.isEmpty()) {
                    trackDescription = "Phiên trình bày " + trackName;
                }
                
                // Chuyển papers sang DTO
                List<ProgramPaperDTO> paperDTOs = papers.stream()
                    .map(paper -> {
                        String coAuthors = paper.getCoAuthors() != null 
                            ? paper.getCoAuthors().stream()
                                .map(PaperCoAuthor::getName)
                                .collect(Collectors.joining(", "))
                            : "";
                        
                        return new ProgramPaperDTO(
                            paper.getId(),
                            paper.getTitle(),
                            paper.getMainAuthor().getFullName(),
                            coAuthors,
                            null  // Không cần presentationTime nữa
                        );
                    })
                    .collect(Collectors.toList());
                
                return new ProgramSessionDTO(
                    trackName,
                    trackDescription,
                    sessionDate,  // Có thể null
                    sessionTime,  // Có thể null
                    room,         // Có thể null
                    paperDTOs
                );
            })
            .sorted((s1, s2) -> s1.getTrackName().compareTo(s2.getTrackName()))
            .collect(Collectors.toList());

        logger.info("Generated {} program sessions", sessions.size());
        return sessions;
    }
}