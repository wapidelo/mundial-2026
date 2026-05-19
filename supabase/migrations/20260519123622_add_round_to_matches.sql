-- Add round column to distinguish group stage from knockout rounds
ALTER TABLE matches ADD COLUMN round TEXT NOT NULL DEFAULT 'group';

-- Constraint on valid round values
ALTER TABLE matches ADD CONSTRAINT matches_round_check
  CHECK (round IN ('group','round_of_32','round_of_16','quarter_final','semi_final','third_place','final'));

-- Make group_id nullable so knockout matches (which have no group) can be inserted
ALTER TABLE matches ALTER COLUMN group_id DROP NOT NULL;
