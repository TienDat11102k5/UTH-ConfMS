package edu.uth.backend.discussion;

import edu.uth.backend.discussion.dto.DiscussionRequestDTO;
import edu.uth.backend.discussion.dto.DiscussionResponseDTO;
import edu.uth.backend.entity.*;
import edu.uth.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiscussionService {

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private PaperRepository paperRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewAssignmentRepository assignmentRepository;

    @Transactional
    public DiscussionResponseDTO createDiscussion(DiscussionRequestDTO request) {
        // Validation
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new RuntimeException("Nội dung không được để trống");
        }
        if (request.getContent().length() > 10000) {
            throw new RuntimeException("Nội dung quá dài (tối đa 10000 ký tự)");
        }

        Paper paper = paperRepository.findById(request.getPaperId())
            .orElseThrow(() -> new RuntimeException("Paper không tồn tại"));

        User author = userRepository.findById(request.getAuthorId())
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Check authorization: User phải là PC member được phân công paper này
        boolean hasAssignment = assignmentRepository.existsByReviewerIdAndPaperId(
            request.getAuthorId(), 
            request.getPaperId()
        );
        if (!hasAssignment) {
            throw new RuntimeException("Bạn không có quyền thảo luận về paper này");
        }

        Discussion discussion = new Discussion();
        discussion.setPaper(paper);
        discussion.setAuthor(author);
        // Sanitize content - remove potential XSS
        String sanitizedContent = sanitizeContent(request.getContent());
        discussion.setContent(sanitizedContent);
        discussion.setIsVisible(true);

        // Nếu có parentId, set parent
        if (request.getParentId() != null) {
            Discussion parent = discussionRepository.findById(request.getParentId())
                .orElseThrow(() -> new RuntimeException("Parent discussion không tồn tại"));
            discussion.setParent(parent);
        }

        Discussion saved = discussionRepository.save(discussion);
        return toDTO(saved);
    }

    public List<DiscussionResponseDTO> getDiscussionsByPaper(Long paperId) {
        List<Discussion> discussions = discussionRepository.findByPaperIdAllComments(paperId);
        return discussions.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<DiscussionResponseDTO> getRootDiscussionsByPaper(Long paperId) {
        List<Discussion> discussions = discussionRepository.findByPaperIdRootComments(paperId);
        return discussions.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<DiscussionResponseDTO> getReplies(Long parentId) {
        List<Discussion> replies = discussionRepository.findRepliesByParentId(parentId);
        return replies.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDiscussion(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion không tồn tại"));
        discussion.setIsVisible(false);
        discussionRepository.save(discussion);
    }

    // Sanitize content để tránh XSS
    private String sanitizeContent(String content) {
        if (content == null) return "";
        
        return content
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#x27;")
            .replaceAll("/", "&#x2F;")
            .trim();
    }

    private DiscussionResponseDTO toDTO(Discussion discussion) {
        DiscussionResponseDTO dto = new DiscussionResponseDTO();
        dto.setId(discussion.getId());
        dto.setPaperId(discussion.getPaper().getId());
        dto.setPaperTitle(discussion.getPaper().getTitle());
        dto.setAuthorId(discussion.getAuthor().getId());
        dto.setAuthorName(discussion.getAuthor().getFullName());
        dto.setContent(discussion.getContent());
        dto.setParentId(discussion.getParent() != null ? discussion.getParent().getId() : null);
        dto.setCreatedAt(discussion.getCreatedAt());
        dto.setIsVisible(discussion.getIsVisible());
        return dto;
    }
}
