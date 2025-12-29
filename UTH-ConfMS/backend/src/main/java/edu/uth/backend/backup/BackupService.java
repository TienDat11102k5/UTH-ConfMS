package edu.uth.backend.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;
import java.util.zip.GZIPInputStream;

@Service
public class BackupService {
    
    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);
    
    @Value("${backup.directory:./backups}")
    private String backupDirectory;
    
    @Autowired
    private DataSource dataSource;
    
    private final ObjectMapper objectMapper;
    
    public BackupService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }
    
    /**
     * Tạo backup bằng cách export dữ liệu thành JSON
     */
    public String createBackup() throws IOException, SQLException {
        // Tạo thư mục backup nếu chưa có
        Path backupPath = Paths.get(backupDirectory);
        if (!Files.exists(backupPath)) {
            Files.createDirectories(backupPath);
            logger.info("Created backup directory: " + backupDirectory);
        }
        
        // Tạo tên file backup với timestamp
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String filename = "backup_" + timestamp + ".json.gz";
        Path filepath = backupPath.resolve(filename);
        
        logger.info("Starting JSON backup: {}", filename);
        
        Map<String, Object> backupData = new HashMap<>();
        backupData.put("timestamp", timestamp);
        backupData.put("version", "1.0");
        
        try (Connection conn = dataSource.getConnection()) {
            // Lấy danh sách tất cả các bảng
            List<String> tables = getTableNames(conn);
            logger.info("Found {} tables to backup", tables.size());
            
            Map<String, List<Map<String, Object>>> tablesData = new HashMap<>();
            
            for (String table : tables) {
                List<Map<String, Object>> rows = exportTable(conn, table);
                tablesData.put(table, rows);
                logger.info("Exported table: {} ({} rows)", table, rows.size());
            }
            
            backupData.put("tables", tablesData);
        }
        
        // Ghi ra file JSON và nén bằng GZIP
        try (FileOutputStream fos = new FileOutputStream(filepath.toFile());
             GZIPOutputStream gzos = new GZIPOutputStream(fos);
             OutputStreamWriter writer = new OutputStreamWriter(gzos)) {
            objectMapper.writeValue(writer, backupData);
        }
        
        logger.info("Backup created successfully: {}", filename);
        return filename;
    }
    
    /**
     * Lấy danh sách tên bảng trong database
     */
    private List<String> getTableNames(Connection conn) throws SQLException {
        List<String> tables = new ArrayList<>();
        DatabaseMetaData metaData = conn.getMetaData();
        
        try (ResultSet rs = metaData.getTables(null, "public", "%", new String[]{"TABLE"})) {
            while (rs.next()) {
                String tableName = rs.getString("TABLE_NAME");
                // Bỏ qua bảng Flyway migration
                if (!tableName.equals("flyway_schema_history")) {
                    tables.add(tableName);
                }
            }
        }
        
        return tables;
    }
    
    /**
     * Export dữ liệu từ một bảng
     */
    private List<Map<String, Object>> exportTable(Connection conn, String tableName) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<>();
        
        String query = "SELECT * FROM " + tableName;
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                rows.add(row);
            }
        }
        
        return rows;
    }
    
    /**
     * Khôi phục database từ file JSON backup
     */
    public void restoreBackup(String filename) throws IOException, SQLException {
        Path filepath = Paths.get(backupDirectory).resolve(filename);
        if (!Files.exists(filepath)) {
            throw new FileNotFoundException("Backup file not found: " + filename);
        }
        
        logger.info("Starting restore from: {}", filename);
        
        // Đọc file JSON
        Map<String, Object> backupData;
        try (FileInputStream fis = new FileInputStream(filepath.toFile());
             GZIPInputStream gzis = new GZIPInputStream(fis);
             InputStreamReader reader = new InputStreamReader(gzis)) {
            backupData = objectMapper.readValue(reader, Map.class);
        }
        
        @SuppressWarnings("unchecked")
        Map<String, List<Map<String, Object>>> tablesData = 
            (Map<String, List<Map<String, Object>>>) backupData.get("tables");
        
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            
            try {
                // Xóa dữ liệu cũ (theo thứ tự để tránh foreign key constraint)
                deleteAllData(conn, tablesData.keySet());
                
                // Import dữ liệu mới
                for (Map.Entry<String, List<Map<String, Object>>> entry : tablesData.entrySet()) {
                    String tableName = entry.getKey();
                    List<Map<String, Object>> rows = entry.getValue();
                    importTable(conn, tableName, rows);
                    logger.info("Imported table: {} ({} rows)", tableName, rows.size());
                }
                
                conn.commit();
                logger.info("Restore completed successfully");
            } catch (Exception e) {
                conn.rollback();
                logger.error("Restore failed, rolled back", e);
                throw e;
            }
        }
    }
    
    /**
     * Xóa toàn bộ dữ liệu từ các bảng
     */
    private void deleteAllData(Connection conn, Set<String> tables) throws SQLException {
        // Tắt foreign key checks tạm thời
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("SET session_replication_role = 'replica'");
            
            for (String table : tables) {
                stmt.execute("DELETE FROM " + table);
                logger.info("Cleared table: {}", table);
            }
            
            stmt.execute("SET session_replication_role = 'origin'");
        }
    }
    
    /**
     * Import dữ liệu vào một bảng
     */
    private void importTable(Connection conn, String tableName, List<Map<String, Object>> rows) throws SQLException {
        if (rows.isEmpty()) {
            return;
        }
        
        // Lấy danh sách cột từ row đầu tiên
        Map<String, Object> firstRow = rows.get(0);
        List<String> columns = new ArrayList<>(firstRow.keySet());
        
        // Tạo INSERT statement
        String columnList = String.join(", ", columns);
        String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(", "));
        String sql = String.format("INSERT INTO %s (%s) VALUES (%s)", tableName, columnList, placeholders);
        
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (Map<String, Object> row : rows) {
                for (int i = 0; i < columns.size(); i++) {
                    Object value = row.get(columns.get(i));
                    pstmt.setObject(i + 1, value);
                }
                pstmt.addBatch();
            }
            pstmt.executeBatch();
        }
    }
    
    /**
     * Lấy danh sách các file backup
     */
    public List<BackupInfo> listBackups() throws IOException {
        Path backupPath = Paths.get(backupDirectory);
        if (!Files.exists(backupPath)) {
            Files.createDirectories(backupPath);
            return new ArrayList<>();
        }
        
        return Files.list(backupPath)
            .filter(path -> path.toString().endsWith(".json.gz"))
            .map(path -> {
                try {
                    BackupInfo info = new BackupInfo();
                    info.setName(path.getFileName().toString());
                    info.setSize(Files.size(path));
                    info.setCreatedAt(Files.getLastModifiedTime(path).toInstant());
                    return info;
                } catch (IOException e) {
                    logger.error("Error reading backup file: " + path, e);
                    return null;
                }
            })
            .filter(Objects::nonNull)
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .collect(Collectors.toList());
    }
    
    /**
     * Tải file backup
     */
    public Path getBackupFile(String filename) throws IOException {
        Path filepath = Paths.get(backupDirectory).resolve(filename);
        if (!Files.exists(filepath)) {
            throw new FileNotFoundException("Backup file not found: " + filename);
        }
        return filepath;
    }
    
    /**
     * Xóa file backup
     */
    public void deleteBackup(String filename) throws IOException {
        Path filepath = Paths.get(backupDirectory).resolve(filename);
        if (!Files.exists(filepath)) {
            throw new FileNotFoundException("Backup file not found: " + filename);
        }
        Files.delete(filepath);
        logger.info("Backup deleted: " + filename);
    }
}
