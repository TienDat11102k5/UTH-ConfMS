package edu.uth.backend.admin;

import edu.uth.backend.entity.user.User;
import edu.uth.backend.repository.PaperRepository;
import edu.uth.backend.repository.user.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    @Autowired private UserRepository userRepo;
    @Autowired private PaperRepository paperRepo;

    public List<User> getAllUsers() { return userRepo.findAll(); }

    public User toggleUserActive(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User không tồn tại"));
        user.setActive(!user.isActive());
        return userRepo.save(user);
    }

    public Map<String, Long> getSystemStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalPapers", paperRepo.count());
        return stats;
    }
}