-- Migration: Add new user profile fields (gender, address, dateOfBirth) and remove country
-- Date: 2025-12-13

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Remove country column if exists
ALTER TABLE users DROP COLUMN IF EXISTS country;

-- Add comments for documentation
COMMENT ON COLUMN users.gender IS 'User gender: Nam, Nữ, Khác';
COMMENT ON COLUMN users.address IS 'User address';
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth';
