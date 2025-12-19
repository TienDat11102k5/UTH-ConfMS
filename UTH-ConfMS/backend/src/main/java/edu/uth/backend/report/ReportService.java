package edu.uth.backend.report;

import edu.uth.backend.entity.*;
import edu.uth.backend.entity.PaperStatus;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    @Autowired private PaperRepository paperRepo;
    // @Autowired private ReviewRepository reviewRepo;
    @Autowired private ReviewAssignmentRepository assignmentRepo;
    @Autowired private ConferenceRepository conferenceRepo;

    // 1. Báo cáo tổng hợp theo conference
    public Map<String, Object> getConferenceReport(Long conferenceId) {
        Conference conference = conferenceRepo.findById(conferenceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));

        // Lấy tất cả papers của conference thông qua tracks
        List<Track> tracks = conference.getTracks();
        List<Paper> papers = new ArrayList<>();
        for (Track track : tracks) {
            papers.addAll(paperRepo.findByTrackId(track.getId()));
        }
        
        long totalSubmissions = papers.size();
        long acceptedCount = papers.stream().filter(p -> p.getStatus() == PaperStatus.ACCEPTED).count();
        long rejectedCount = papers.stream().filter(p -> p.getStatus() == PaperStatus.REJECTED).count();
        long underReviewCount = papers.stream().filter(p -> p.getStatus() == PaperStatus.UNDER_REVIEW).count();
        
        double acceptanceRate = totalSubmissions > 0 ? (acceptedCount * 100.0 / totalSubmissions) : 0.0;
        
        Map<String, Object> report = new HashMap<>();
        report.put("conferenceId", conferenceId);
        report.put("conferenceName", conference.getName());
        report.put("totalSubmissions", totalSubmissions);
        report.put("accepted", acceptedCount);
        report.put("rejected", rejectedCount);
        report.put("underReview", underReviewCount);
        report.put("acceptanceRate", Math.round(acceptanceRate * 100.0) / 100.0);
        report.put("generatedAt", new Date());
        
        return report;
    }

    // 2. Báo cáo theo track
    public Map<String, Object> getTrackReport(Long conferenceId) {
        Conference conference = conferenceRepo.findById(conferenceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));

        // Lấy tất cả papers của conference thông qua tracks
        List<Track> conferenceTracks = conference.getTracks();
        List<Paper> papers = new ArrayList<>();
        for (Track track : conferenceTracks) {
            papers.addAll(paperRepo.findByTrackId(track.getId()));
        }
        
        Map<String, Map<String, Object>> trackStats = new HashMap<>();
        
        for (Track track : conferenceTracks) {
            List<Paper> trackPapers = papers.stream()
                    .filter(p -> p.getTrack() != null && p.getTrack().getId().equals(track.getId()))
                    .collect(Collectors.toList());
            
            long total = trackPapers.size();
            long accepted = trackPapers.stream().filter(p -> p.getStatus() == PaperStatus.ACCEPTED).count();
            long rejected = trackPapers.stream().filter(p -> p.getStatus() == PaperStatus.REJECTED).count();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("trackName", track.getName());
            stats.put("total", total);
            stats.put("accepted", accepted);
            stats.put("rejected", rejected);
            stats.put("acceptanceRate", total > 0 ? Math.round((accepted * 100.0 / total) * 100.0) / 100.0 : 0.0);
            
            trackStats.put(track.getName(), stats);
        }
        
        Map<String, Object> report = new HashMap<>();
        report.put("conferenceId", conferenceId);
        report.put("conferenceName", conference.getName());
        report.put("tracks", trackStats);
        report.put("generatedAt", new Date());
        
        return report;
    }

    // 3. Báo cáo tiến độ review
    public Map<String, Object> getReviewProgressReport(Long conferenceId) {
        Conference conference = conferenceRepo.findById(conferenceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));

        // Lấy tất cả papers của conference thông qua tracks
        List<Track> tracks = conference.getTracks();
        List<Paper> papers = new ArrayList<>();
        for (Track track : tracks) {
            papers.addAll(paperRepo.findByTrackId(track.getId()));
        }
        List<ReviewAssignment> allAssignments = new ArrayList<>();
        
        for (Paper paper : papers) {
            allAssignments.addAll(assignmentRepo.findByPaperId(paper.getId()));
        }
        
        long totalAssignments = allAssignments.size();
        long completed = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.COMPLETED).count();
        long pending = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PENDING).count();
        long accepted = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ACCEPTED).count();
        long declined = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.DECLINED).count();
        
        double completionRate = totalAssignments > 0 ? (completed * 100.0 / totalAssignments) : 0.0;
        
        Map<String, Object> report = new HashMap<>();
        report.put("conferenceId", conferenceId);
        report.put("conferenceName", conference.getName());
        report.put("totalAssignments", totalAssignments);
        report.put("completed", completed);
        report.put("pending", pending);
        report.put("accepted", accepted);
        report.put("declined", declined);
        report.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        report.put("generatedAt", new Date());
        
        return report;
    }

    // 4. Export danh sách papers (cho proceedings)
    public List<Map<String, Object>> exportPapersForProceedings(Long conferenceId) {
        Conference conference = conferenceRepo.findById(conferenceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội nghị"));
        
        // Lấy tất cả papers của conference thông qua tracks
        List<Track> tracks = conference.getTracks();
        List<Paper> papers = new ArrayList<>();
        for (Track track : tracks) {
            papers.addAll(paperRepo.findByTrackId(track.getId()));
        }
        papers = papers.stream()
                .filter(p -> p.getStatus() == PaperStatus.ACCEPTED)
                .collect(Collectors.toList());
        
        return papers.stream().map(paper -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", paper.getId());
            data.put("title", paper.getTitle());
            data.put("abstract", paper.getAbstractText());
            data.put("mainAuthor", paper.getMainAuthor().getFullName());
            data.put("mainAuthorEmail", paper.getMainAuthor().getEmail());
            data.put("track", paper.getTrack() != null ? paper.getTrack().getName() : null);
            data.put("submittedAt", paper.getCreatedAt());
            // Co-authors
            if (paper.getCoAuthors() != null && !paper.getCoAuthors().isEmpty()) {
                List<String> coAuthorNames = paper.getCoAuthors().stream()
                        .map(ca -> ca.getName() != null ? ca.getName() : "")
                        .filter(name -> !name.isEmpty())
                        .collect(Collectors.toList());
                data.put("coAuthors", coAuthorNames);
            }
            return data;
        }).collect(Collectors.toList());
    }
}
