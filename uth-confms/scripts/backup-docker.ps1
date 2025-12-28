# Database backup using Docker
# This script creates a backup by connecting to the PostgreSQL container

$ErrorActionPreference = "Stop"

Write-Host "Database Backup Script for UTH-ConfMS (Docker version)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$CONTAINER_NAME = "uth_db"
$DB_NAME = "confms_db"
$DB_USER = "postgres"
$BACKUP_DIR = ".\backups"
$RETENTION_DAYS = 7

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

# Generate backup filename with timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "uth_confms_backup_$TIMESTAMP.sql"
$BACKUP_PATH = Join-Path $BACKUP_DIR $BACKUP_FILE

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Container: $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host "  Backup File: $BACKUP_FILE" -ForegroundColor Gray
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker is not running or not accessible!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if container exists and is running
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "ERROR: Container '$CONTAINER_NAME' is not running!" -ForegroundColor Red
    Write-Host "Please start the database container first:" -ForegroundColor Yellow
    Write-Host "  cd docker" -ForegroundColor Cyan
    Write-Host "  docker compose up -d postgres" -ForegroundColor Cyan
    exit 1
}

Write-Host "Container status: $containerStatus" -ForegroundColor Green
Write-Host ""
Write-Host "Starting database backup..." -ForegroundColor Green

try {
    # Perform backup using docker exec
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME -F c -f "/tmp/$BACKUP_FILE"
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    # Copy backup file from container to host
    docker cp "${CONTAINER_NAME}:/tmp/$BACKUP_FILE" $BACKUP_PATH
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy backup file from container"
    }
    
    # Remove temp file from container
    docker exec $CONTAINER_NAME rm -f "/tmp/$BACKUP_FILE"
    
    Write-Host "Database dump completed successfully!" -ForegroundColor Green
    
    # Compress backup
    Write-Host "Compressing backup file..." -ForegroundColor Yellow
    Compress-Archive -Path $BACKUP_PATH -DestinationPath "$BACKUP_PATH.zip" -Force
    Remove-Item $BACKUP_PATH
    $BACKUP_PATH = "$BACKUP_PATH.zip"
    
    $fileSize = (Get-Item $BACKUP_PATH).Length / 1MB
    Write-Host ""
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "  File: $BACKUP_PATH" -ForegroundColor Cyan
    Write-Host "  Size: $($fileSize.ToString('0.00')) MB" -ForegroundColor Cyan
    Write-Host ""
    
    # Clean up old backups
    Write-Host "Cleaning up old backups (older than $RETENTION_DAYS days)..." -ForegroundColor Yellow
    $oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "uth_confms_backup_*.zip" | 
                  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RETENTION_DAYS) }
    
    if ($oldBackups.Count -gt 0) {
        foreach ($oldBackup in $oldBackups) {
            Remove-Item $oldBackup.FullName -Force
            Write-Host "  Deleted old backup: $($oldBackup.Name)" -ForegroundColor Gray
        }
        Write-Host "Deleted $($oldBackups.Count) old backup(s)" -ForegroundColor Green
    } else {
        Write-Host "No old backups to delete" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host "Backup Summary" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host "Status: SUCCESS" -ForegroundColor Green
    Write-Host "Database: $DB_NAME" -ForegroundColor White
    Write-Host "Backup File: $BACKUP_PATH" -ForegroundColor White
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
