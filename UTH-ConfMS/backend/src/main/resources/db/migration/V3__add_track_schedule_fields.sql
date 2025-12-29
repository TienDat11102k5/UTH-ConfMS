-- Add session_date, session_time and room fields to tracks table for program scheduling

ALTER TABLE tracks ADD COLUMN session_date VARCHAR(50);
ALTER TABLE tracks ADD COLUMN session_time VARCHAR(50);
ALTER TABLE tracks ADD COLUMN room VARCHAR(100);

-- Add comments
COMMENT ON COLUMN tracks.session_date IS 'Ngày tổ chức phiên, VD: 2025-01-15 hoặc Ngày 15/01/2025';
COMMENT ON COLUMN tracks.session_time IS 'Thời gian phiên trình bày, VD: 09:00 - 11:00';
COMMENT ON COLUMN tracks.room IS 'Phòng/địa điểm tổ chức, VD: Phòng 201, Hội trường A';
