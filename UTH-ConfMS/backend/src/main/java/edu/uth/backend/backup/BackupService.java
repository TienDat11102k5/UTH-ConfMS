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
            @SuppressWarnings("unchecked")
            Map<String, Object> temp = (Map<String, Object>) objectMapper.readValue(reader, Map.class);
            backupData = temp;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, List<Map<String, Object>>> tablesData = 
            (Map<String, List<Map<String, Object>>>) backupData.get("tables");
        
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            
            try {
                // Xóa dữ liệu cũ (theo thứ tự để tránh foreign key constraint)
                deleteAllData(conn, tablesData.keySet());
                
                // Import dữ liệu mới theo thứ tự dependency
                List<String> orderedTables = getTableImportOrder(tablesData.keySet());
                logger.info("Tables to import: {}", orderedTables);
                for (String tableName : orderedTables) {
                    List<Map<String, Object>> rows = tablesData.get(tableName);
                    if (rows != null) {
                        logger.info("Importing table: {} with {} rows", tableName, rows.size());
                        importTable(conn, tableName, rows);
                        logger.info("Imported table: {} ({} rows)", tableName, rows.size());
                    }
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
                // Skip tables with JSONB columns due to complexity
                if (!table.equals("ai_audit_logs") && !table.equals("paper_synopses") && 
                    !table.equals("email_drafts") && !table.equals("user_activity_history") &&
                    !table.equals("ai_feature_flags")) {
                    stmt.execute("DELETE FROM " + table);
                    logger.info("Cleared table: {}", table);
                } else {
                    logger.warn("Skipped clearing table {} due to JSONB complexity", table);
                }
            }
            
            stmt.execute("SET session_replication_role = 'origin'");
        }
    }
    
    /**
     * Import dữ liệu vào một bảng
     */
    private void importTable(Connection conn, String tableName, List<Map<String, Object>> rows) throws SQLException {
        logger.info("Starting import for table: {} with {} rows", tableName, rows.size());
        
        if (rows.isEmpty()) {
            logger.info("Table {} is empty, skipping", tableName);
            return;
        }
        
        // Skip ai_audit_logs due to JSONB complexity
        if (tableName.equals("ai_audit_logs") || tableName.equals("paper_synopses") || 
            tableName.equals("email_drafts") || tableName.equals("user_activity_history") ||
            tableName.equals("ai_feature_flags")) {
            logger.warn("Skipping table {} due to JSONB complexity", tableName);
            return;
        }
        
        // Lấy danh sách cột từ row đầu tiên
        Map<String, Object> firstRow = rows.get(0);
        List<String> columns = new ArrayList<>(firstRow.keySet());
        
        // Lấy metadata của bảng để biết kiểu dữ liệu của từng cột
        Map<String, String> columnTypes = getColumnTypes(conn, tableName);
        
        // Tạo INSERT statement với cast cho JSONB columns
        String columnList = String.join(", ", columns);
        StringBuilder placeholderBuilder = new StringBuilder();
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) placeholderBuilder.append(", ");
            String columnName = columns.get(i);
            String columnType = columnTypes.get(columnName.toLowerCase());
            
            if (columnType != null && (columnType.contains("jsonb") || columnType.contains("json"))) {
                placeholderBuilder.append("CAST(? AS JSONB)");
            } else {
                placeholderBuilder.append("?");
            }
        }
        String sql = String.format("INSERT INTO %s (%s) VALUES (%s)", tableName, columnList, placeholderBuilder.toString());
        
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (Map<String, Object> row : rows) {
                for (int i = 0; i < columns.size(); i++) {
                    String columnName = columns.get(i);
                    Object value = row.get(columnName);
                    String columnType = columnTypes.get(columnName.toLowerCase());
                    
                    // Xử lý các kiểu dữ liệu đặc biệt
                    if (value != null && columnType != null) {
                        if (columnType.contains("timestamp")) {
                            // Chuyển đổi timestamp từ các định dạng khác nhau
                            if (value instanceof Number) {
                                // Nếu là số (milliseconds hoặc seconds)
                                long timestamp = ((Number) value).longValue();
                                if (timestamp > 1000000000000L) {
                                    // Milliseconds
                                    value = new Timestamp(timestamp);
                                } else {
                                    // Seconds
                                    value = new Timestamp(timestamp * 1000);
                                }
                            } else if (value instanceof String) {
                                // Nếu là string, thử parse
                                try {
                                    value = Timestamp.valueOf((String) value);
                                } catch (Exception e) {
                                    // Nếu không parse được, để nguyên
                                }
                            }
                        } else if (columnType.contains("date")) {
                            // Xử lý kiểu date
                            if (value instanceof Number) {
                                // Nếu là số (milliseconds hoặc seconds)
                                long timestamp = ((Number) value).longValue();
                                if (timestamp > 1000000000000L) {
                                    // Milliseconds
                                    value = new java.sql.Date(timestamp);
                                } else {
                                    // Seconds
                                    value = new java.sql.Date(timestamp * 1000);
                                }
                            } else if (value instanceof String) {
                                // Nếu là string, thử parse
                                try {
                                    value = java.sql.Date.valueOf((String) value);
                                } catch (Exception e) {
                                    // Nếu không parse được, để nguyên
                                }
                            }
                        } else if (columnType.contains("jsonb") || columnType.contains("json")) {
                            // Xử lý JSONB - chuyển đổi từ nested object thành JSON string
                            if (value instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> jsonMap = (Map<String, Object>) value;
                                
                                // Kiểm tra nếu có cấu trúc đặc biệt từ backup
                                if (jsonMap.containsKey("type") && "jsonb".equals(jsonMap.get("type"))) {
                                    // Lấy giá trị thực từ trường "value"
                                    Object actualValue = jsonMap.get("value");
                                    if (actualValue instanceof String) {
                                        value = actualValue; // Đã là JSON string
                                    } else {
                                        try {
                                            value = objectMapper.writeValueAsString(actualValue);
                                        } catch (Exception e) {
                                            logger.warn("Failed to serialize nested JSON value: " + e.getMessage());
                                            value = actualValue.toString();
                                        }
                                    }
                                } else {
                                    // Map thông thường, serialize thành JSON
                                    try {
                                        value = objectMapper.writeValueAsString(jsonMap);
                                    } catch (Exception e) {
                                        logger.warn("Failed to serialize JSON map: " + e.getMessage());
                                        value = jsonMap.toString();
                                    }
                                }
                            } else if (value instanceof List) {
                                // List, serialize thành JSON
                                try {
                                    value = objectMapper.writeValueAsString(value);
                                } catch (Exception e) {
                                    logger.warn("Failed to serialize JSON list: " + e.getMessage());
                                    value = value.toString();
                                }
                            } else if (value instanceof String) {
                                // Đã là string, kiểm tra xem có phải JSON hợp lệ không
                                String strValue = (String) value;
                                try {
                                    // Thử parse để validate JSON
                                    objectMapper.readTree(strValue);
                                    // Nếu parse được thì để nguyên
                                } catch (Exception e) {
                                    // Nếu không phải JSON hợp lệ, wrap trong quotes
                                    value = "\"" + strValue.replace("\"", "\\\"") + "\"";
                                }
                            }
                            // Để PostgreSQL tự động cast string thành JSONB
                        }
                    }
                    
                    pstmt.setObject(i + 1, value);
                }
                pstmt.addBatch();
            }
            pstmt.executeBatch();
        }
    }
    
    /**
     * Lấy kiểu dữ liệu của các cột trong bảng
     */
    private Map<String, String> getColumnTypes(Connection conn, String tableName) throws SQLException {
        Map<String, String> columnTypes = new HashMap<>();
        DatabaseMetaData metaData = conn.getMetaData();
        
        try (ResultSet rs = metaData.getColumns(null, "public", tableName, null)) {
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME").toLowerCase();
                String typeName = rs.getString("TYPE_NAME").toLowerCase();
                columnTypes.put(columnName, typeName);
            }
        }
        
        return columnTypes;
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
    
    /**
     * Sắp xếp thứ tự import các bảng để tránh foreign key constraint
     */
    private List<String> getTableImportOrder(Set<String> tables) {
        List<String> orderedTables = new ArrayList<>();
        
        // Thứ tự ưu tiên: các bảng không có dependency trước, có dependency sau
        String[] preferredOrder = {
            // Core tables first (no dependencies)
            "roles",
            "users", 
            "user_roles",
            
            // Conference related
            "conferences",
            "tracks",
            
            // Papers and submissions
            "papers",
            "co_authors",
            
            // Reviews and assignments
            "review_assignments",
            "reviews",
            
            // Decisions and notifications
            "decisions",
            "notifications",
            
            // Auth and security
            "password_reset_tokens",
            "otps",
            
            // Audit and logs
            "audit_logs",
            
            // Other tables (skip ai_audit_logs due to JSONB complexity)
            "discussions",
            "feature_flags"
        };
        
        // Add tables in preferred order if they exist
        for (String table : preferredOrder) {
            if (tables.contains(table)) {
                orderedTables.add(table);
            }
        }
        
        // Add any remaining tables that weren't in the preferred order
        // Skip tables with JSONB columns due to complexity
        for (String table : tables) {
            if (!orderedTables.contains(table) && 
                !table.equals("ai_audit_logs") && !table.equals("paper_synopses") && 
                !table.equals("email_drafts") && !table.equals("user_activity_history") &&
                !table.equals("ai_feature_flags")) {
                orderedTables.add(table);
            }
        }
        
        return orderedTables;
    }
}
