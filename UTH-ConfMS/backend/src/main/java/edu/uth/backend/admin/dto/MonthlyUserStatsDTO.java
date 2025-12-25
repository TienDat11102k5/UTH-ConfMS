package edu.uth.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyUserStatsDTO {
    private String month; // e.g., "T1", "T2", etc.
    private Long users;
}
