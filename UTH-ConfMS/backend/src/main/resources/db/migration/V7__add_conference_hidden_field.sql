-- Add is_hidden column to conferences table
ALTER TABLE conferences ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Update existing conferences to not be hidden
UPDATE conferences SET is_hidden = FALSE WHERE is_hidden IS NULL;
