package edu.uth.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyAccessStatsDTO {
    private String day; // e.g., "T2", "T3", "CN"
    private Long visits;
}
