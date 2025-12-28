# Database backup script for UTH-ConfMS (PowerShell version)
# Usage: .\backup-database.ps1

$ErrorActionPreference = "Stop"

Write-Host "Database Backup Script for UTH-ConfMS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5435" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "confms_db" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "123456" }
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
$RETENTION_DAYS = 7

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

# Generate backup filename with timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "uth_confms_backup_$TIMESTAMP.sql"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Database Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Database Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  Database Name: $DB_NAME" -ForegroundColor Gray
Write-Host "  Database User: $DB_USER" -ForegroundColor Gray
Write-Host "  Backup File: $BACKUP_FILE" -ForegroundColor Gray
Write-Host ""

# Check if pg_dump exists
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "ERROR: pg_dump not found in PATH!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or add them to your PATH." -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting database backup..." -ForegroundColor Green

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Perform backup
    & pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "Database dump completed successfully!" -ForegroundColor Green
    
    # Compress backup
    Write-Host "Compressing backup file..." -ForegroundColor Yellow
    Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
    Remove-Item $BACKUP_FILE
    $BACKUP_FILE = "$BACKUP_FILE.zip"
    
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "  File: $BACKUP_FILE" -ForegroundColor Cyan
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
    Write-Host "Backup process completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
