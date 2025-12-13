package edu.uth.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "papers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Paper extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String abstractText; // Tóm tắt

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "camera_ready_path")
    private String cameraReadyPath;

    @Enumerated(EnumType.STRING)
    private PaperStatus status = PaperStatus.SUBMITTED;

    // Tác giả chính
    @ManyToOne
    @JoinColumn(name = "main_author_id", nullable = false)
    private User mainAuthor;

    // Thuộc Track nào
    @ManyToOne
    @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    // Danh sách đồng tác giả (Metadata hiển thị)
    @OneToMany(mappedBy = "paper", cascade = CascadeType.ALL)
    private List<PaperCoAuthor> coAuthors;
}