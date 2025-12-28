# Database restore script for UTH-ConfMS (PowerShell version)
# Usage: .\restore-database.ps1 <backup_file>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

Write-Host "Database Restore Script for UTH-ConfMS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5435" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "confms_db" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "123456" }

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "ERROR: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

$BackupFileFullPath = (Resolve-Path $BackupFile).Path
$BackupFileName = Split-Path $BackupFileFullPath -Leaf
$BackupFileSize = (Get-Item $BackupFileFullPath).Length / 1MB

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Database Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Database Port: $DB_PORT" -ForegroundColor Gray
Write-Host "  Database Name: $DB_NAME" -ForegroundColor Gray
Write-Host "  Database User: $DB_USER" -ForegroundColor Gray
Write-Host "  Backup File: $BackupFileName" -ForegroundColor Gray
Write-Host "  File Size: $($BackupFileSize.ToString('0.00')) MB" -ForegroundColor Gray
Write-Host ""

# Check if psql and pg_restore exist
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
$pgRestorePath = Get-Command pg_restore -ErrorAction SilentlyContinue

if (-not $psqlPath -or -not $pgRestorePath) {
    Write-Host "ERROR: PostgreSQL client tools not found in PATH!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or add them to your PATH." -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Confirmation
Write-Host "WARNING: This will DROP and RECREATE the database!" -ForegroundColor Red
Write-Host "All existing data will be LOST!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Restore cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting database restore..." -ForegroundColor Green

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Extract if compressed
    $RestoreFile = $BackupFileFullPath
    $TempFile = $null
    
    if ($BackupFileFullPath -match '\.(zip|gz)$') {
        Write-Host "Extracting compressed backup..." -ForegroundColor Yellow
        $TempDir = Join-Path $env:TEMP "uth_confms_restore"
        if (-not (Test-Path $TempDir)) {
            New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        }
        
        if ($BackupFileFullPath -match '\.zip$') {
            Expand-Archive -Path $BackupFileFullPath -DestinationPath $TempDir -Force
            $RestoreFile = Get-ChildItem -Path $TempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
        } elseif ($BackupFileFullPath -match '\.gz$') {
            # For .gz files, we would need 7-Zip or similar
            Write-Host "ERROR: .gz file decompression requires 7-Zip" -ForegroundColor Red
            Write-Host "Please extract the file manually or install 7-Zip" -ForegroundColor Yellow
            exit 1
        }
        
        $TempFile = $RestoreFile
        Write-Host "Extracted to: $RestoreFile" -ForegroundColor Green
    }
    
    # Drop existing database
    Write-Host "Dropping existing database..." -ForegroundColor Yellow
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to drop database"
    }
    
    # Create new database
    Write-Host "Creating new database..." -ForegroundColor Yellow
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database"
    }
    
    # Restore backup
    Write-Host "Restoring backup data..." -ForegroundColor Yellow
    & pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v $RestoreFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: pg_restore completed with warnings/errors" -ForegroundColor Yellow
        Write-Host "This is sometimes normal for certain database objects" -ForegroundColor Gray
    }
    
    # Clean up temp file
    if ($TempFile) {
        Remove-Item $TempFile -Force -ErrorAction SilentlyContinue
        $TempDir = Split-Path $TempFile -Parent
        Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Host "Database restore completed successfully!" -ForegroundColor Green
    Write-Host "Database: $DB_NAME" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Restore failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Clean up temp file on error
    if ($TempFile) {
        Remove-Item $TempFile -Force -ErrorAction SilentlyContinue
        $TempDir = Split-Path $TempFile -Parent
        Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
