package edu.uth.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalUsers;
    private Long todayActiveUsers;
    private Double totalUsersTrend; 
    private Double todayUsersTrend; 
}
