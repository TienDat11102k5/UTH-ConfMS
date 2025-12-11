package edu.uth.backend.proceedings;

import edu.uth.backend.entity.Paper;
import edu.uth.backend.entity.PaperStatus;
import edu.uth.backend.proceedings.dto.ProceedingsDTO;
import edu.uth.backend.repository.PaperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProceedingsService {

    @Autowired private PaperRepository paperRepo;

    public List<ProceedingsDTO> getConferenceProceedings(Long conferenceId) {
        // 1. Lấy tất cả bài ACCEPTED của hội nghị đó
        List<Paper> acceptedPapers = paperRepo.findByTrack_ConferenceIdAndStatus(conferenceId, PaperStatus.ACCEPTED);

        // 2. Chuyển đổi sang DTO
        return acceptedPapers.stream().map(paper -> new ProceedingsDTO(
                paper.getTrack().getName(),
                paper.getTitle(),
                paper.getMainAuthor().getFullName(),
                paper.getAbstractText(),
                paper.getCameraReadyPath() 
        )).collect(Collectors.toList());
    }
}