package edu.uth.backend.admin;

import edu.uth.backend.admin.dto.DashboardStatsDTO;
import edu.uth.backend.admin.dto.MonthlyUserStatsDTO;
import edu.uth.backend.admin.dto.WeeklyAccessStatsDTO;
import edu.uth.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardStatsController {

    private final UserRepository userRepository;

    @GetMapping("/stats")
    // @PreAuthorize("hasRole('ROLE_ADMIN')") // Temporarily disabled for testing
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        // Tổng số người dùng từ database
        long totalUsers = userRepository.count();

        // Người dùng active hôm nay - ước lượng 10%
        long todayActiveUsers = Math.max(1, totalUsers / 10);

        // Tính trend - giả định tăng trưởng 5% mỗi tháng
        double totalUsersTrend = 5.0;

        // Trend hôm nay - random nhẹ
        double todayUsersTrend = (Math.random() - 0.5) * 10; // -5% to +5%

        DashboardStatsDTO stats = new DashboardStatsDTO(
                totalUsers,
                todayActiveUsers,
                Math.round(totalUsersTrend * 10.0) / 10.0,
                Math.round(todayUsersTrend * 10.0) / 10.0);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/monthly")
    // @PreAuthorize("hasRole('ROLE_ADMIN')") // Temporarily disabled for testing
    public ResponseEntity<List<MonthlyUserStatsDTO>> getMonthlyStats() {
        List<MonthlyUserStatsDTO> stats = new ArrayList<>();
        long totalUsers = userRepository.count();

        // Giả định tăng trưởng đều qua 12 tháng
        long startUsers = Math.max(10, totalUsers - (totalUsers / 5)); // Start from 80% of current
        long increment = (totalUsers - startUsers) / 12;

        for (int i = 1; i <= 12; i++) {
            String monthLabel = "T" + i;
            long userCount = startUsers + (increment * i);
            stats.add(new MonthlyUserStatsDTO(monthLabel, userCount));
        }

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/weekly")
    // @PreAuthorize("hasRole('ROLE_ADMIN')") // Temporarily disabled for testing
    public ResponseEntity<List<WeeklyAccessStatsDTO>> getWeeklyStats() {
        List<WeeklyAccessStatsDTO> stats = new ArrayList<>();

        // Map từ DayOfWeek sang label tiếng Việt
        String[] dayLabels = { "T2", "T3", "T4", "T5", "T6", "T7", "CN" };

        // Dữ liệu ước lượng dựa trên tổng users
        long totalUsers = userRepository.count();
        long baseVisits = Math.max(10, totalUsers / 10);

        for (int i = 0; i < 7; i++) {
            // Weekdays cao hơn weekend
            double multiplier = (i < 5) ? 1.0 + Math.random() * 0.3 : 0.6 + Math.random() * 0.2;
            long visits = (long) (baseVisits * multiplier);
            stats.add(new WeeklyAccessStatsDTO(dayLabels[i], visits));
        }

        return ResponseEntity.ok(stats);
    }
}
