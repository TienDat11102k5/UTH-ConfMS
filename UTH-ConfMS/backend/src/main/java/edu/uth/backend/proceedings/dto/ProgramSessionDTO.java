package edu.uth.backend.proceedings.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgramSessionDTO {
    private String trackName;
    private String trackDescription;
    private String sessionDate;
    private String sessionTime;
    private String room;
    private List<ProgramPaperDTO> papers;
}
