package edu.uth.backend.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class PaperSynopsisResponse {
    private String synopsis;
    private List<String> keyThemes;
    private String methodology;
    private List<String> claims;
    private List<String> datasets;
    private String contributionType;
    private Integer wordCount;
}
