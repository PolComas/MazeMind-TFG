-- ============================================
-- Daily Streak Table
-- ============================================
-- Stores daily challenge streak data per user.
-- Used by the Daily Challenge feature to persist
-- streak counts across devices for authenticated users.
-- ============================================

CREATE TABLE IF NOT EXISTS daily_streak (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  best_streak        INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,          -- YYYY-MM-DD format
  last_stars         INTEGER DEFAULT 0,
  last_time_seconds  REAL    DEFAULT NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id)
);

-- Enable Row Level Security
ALTER TABLE daily_streak ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own streak
CREATE POLICY "Users can read own streak"
  ON daily_streak FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streak"
  ON daily_streak FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON daily_streak FOR UPDATE
  USING (auth.uid() = user_id);
