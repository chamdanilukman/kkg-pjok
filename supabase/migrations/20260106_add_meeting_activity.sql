-- Add activity link to meetings (notulen)
ALTER TABLE IF EXISTS meetings
  ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_meetings_activity_id ON meetings(activity_id);
