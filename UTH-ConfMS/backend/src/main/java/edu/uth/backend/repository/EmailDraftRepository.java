package edu.uth.backend.repository;

import edu.uth.backend.entity.EmailDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailDraftRepository extends JpaRepository<EmailDraft, Long> {
    
    List<EmailDraft> findByConferenceId(Long conferenceId);
    
    List<EmailDraft> findByConferenceIdAndStatus(Long conferenceId, EmailDraft.DraftStatus status);
    
    List<EmailDraft> findByPaperId(Long paperId);
    
    List<EmailDraft> findByRecipientId(Long recipientId);
}


