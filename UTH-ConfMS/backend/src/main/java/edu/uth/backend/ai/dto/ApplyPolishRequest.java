package edu.uth.backend.ai.dto;

import lombok.Data;

@Data
public class ApplyPolishRequest {
    private Long paperId;
    private String polishedAbstract;
    private boolean userConfirmed;
    private Long conferenceId;
}
