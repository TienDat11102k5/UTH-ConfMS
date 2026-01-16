package edu.uth.backend.backup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backups")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {
    
    @Autowired
    private BackupService backupService;
    
    /**
     * Tạo backup mới
     */
    @PostMapping
    public ResponseEntity<?> createBackup() {
        try {
            String filename = backupService.createBackup();
            return ResponseEntity.ok(Map.of(
                "message", "Backup created successfully",
                "filename", filename
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to create backup: " + e.getMessage()));
        }
    }
    
    /**
     * Lấy danh sách backup
     */
    @GetMapping
    public ResponseEntity<List<BackupInfo>> listBackups() {
        try {
            List<BackupInfo> backups = backupService.listBackups();
            return ResponseEntity.ok(backups);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Tải file backup
     */
    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String filename) {
        try {
            Path filepath = backupService.getBackupFile(filename);
            Resource resource = new FileSystemResource(filepath);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Khôi phục từ backup
     */
    @PostMapping("/restore/{filename}")
    public ResponseEntity<?> restoreBackup(@PathVariable String filename) {
        try {
            backupService.restoreBackup(filename);
            return ResponseEntity.ok(Map.of("message", "Database restored successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to restore backup: " + e.getMessage()));
        }
    }
    
    /**
     * Xóa file backup
     */
    @DeleteMapping("/{filename}")
    public ResponseEntity<?> deleteBackup(@PathVariable String filename) {
        try {
            backupService.deleteBackup(filename);
            return ResponseEntity.ok(Map.of("message", "Backup deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to delete backup: " + e.getMessage()));
        }
    }
    
    /**
     * Upload và restore backup từ file
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndRestoreBackup(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
            }
            
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".json.gz") && !filename.endsWith(".json"))) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only .json or .json.gz files are accepted"));
            }
            
            // Upload và restore
            backupService.uploadAndRestore(file);
            return ResponseEntity.ok(Map.of("message", "Backup uploaded and restored successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to upload and restore backup: " + e.getMessage()));
        }
    }
}
