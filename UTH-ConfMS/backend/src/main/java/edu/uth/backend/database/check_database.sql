-- Quick Check Script for User Profile Update Issue
-- Run this in PostgreSQL (psql or pgAdmin)

-- 1. Check if new columns exist
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
    AND column_name IN ('gender', 'address', 'date_of_birth', 'country')
ORDER BY column_name;

-- Expected result: gender, address, date_of_birth should exist
-- country should NOT exist

-- 2. If columns are missing, run this to add them:
-- Uncomment the lines below if needed
/*
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users DROP COLUMN IF EXISTS country;
*/

-- 3. Check current user data
SELECT 
    id, 
    email, 
    full_name, 
    gender, 
    address, 
    TO_CHAR(date_of_birth, 'YYYY-MM-DD') as date_of_birth,
    phone,
    affiliation
FROM users 
ORDER BY id
LIMIT 5;

-- 4. Check if there are any constraints that might fail
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;
