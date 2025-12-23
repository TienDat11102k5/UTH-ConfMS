package edu.uth.backend.proceedings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ProceedingsExportDTO {
    private Long conferenceId;
    private Integer totalPapers;
    private List<ProceedingsDTO> papers;
}
