#!/bin/bash

# Database backup script for UTH-ConfMS
# Usage: ./backup-database.sh

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5435}"
DB_NAME="${DB_NAME:-confms_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-123456}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=7

echo "Database backup script for UTH-ConfMS"
echo "======================================"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/uth_confms_backup_$TIMESTAMP.sql"

echo "Starting database backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Perform backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -f "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "Backup completed: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1 || echo 'unknown')"

# Delete old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "uth_confms_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo "Backup process completed successfully!"
