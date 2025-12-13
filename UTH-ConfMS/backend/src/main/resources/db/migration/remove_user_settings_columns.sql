-- Migration script to remove notification and privacy settings columns from users table
-- This rollback removes the settings columns that are no longer needed

-- Drop the notification and privacy settings columns
ALTER TABLE users 
DROP COLUMN IF EXISTS email_notifications,
DROP COLUMN IF EXISTS review_notifications,
DROP COLUMN IF EXISTS decision_notifications,
DROP COLUMN IF EXISTS show_email_public,
DROP COLUMN IF EXISTS show_profile_public;

-- Verify the changes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
