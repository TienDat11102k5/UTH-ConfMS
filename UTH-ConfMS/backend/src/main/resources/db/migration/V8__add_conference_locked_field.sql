-- V8__add_conference_locked_field.sql
-- Add is_locked field to conferences table

ALTER TABLE conferences ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_locked = false
UPDATE conferences SET is_locked = FALSE WHERE is_locked IS NULL;
