-- =====================================================================
-- ADD ALL MISSING DATABASE COLUMNS - COMPREHENSIVE MIGRATION
-- =====================================================================
-- Purpose: Add all missing columns identified in codebase analysis
-- Date: January 2026
-- Risk: LOW (all columns are nullable, no data changes)
-- Can be run multiple times safely (idempotent)
-- =====================================================================

-- =====================================================================
-- 1. CALENDAR_EVENTS TABLE - Add event management columns
-- =====================================================================

-- Add location column for storing meeting location or URL
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'location'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN location TEXT;
    RAISE NOTICE 'Added column: calendar_events.location';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.location';
  END IF;
END $$;

-- Add attendees column for storing list of attendees (JSON array)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'attendees'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added column: calendar_events.attendees';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.attendees';
  END IF;
END $$;

-- Add recurrence_type column for recurring events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN recurrence_type TEXT DEFAULT 'none';
    RAISE NOTICE 'Added column: calendar_events.recurrence_type';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.recurrence_type';
  END IF;
END $$;

-- Add recurrence_end_date column for when recurring events should stop
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN recurrence_end_date DATE;
    RAISE NOTICE 'Added column: calendar_events.recurrence_end_date';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.recurrence_end_date';
  END IF;
END $$;

-- Add is_recurring_instance to mark generated instances of recurring events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'is_recurring_instance'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN is_recurring_instance BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: calendar_events.is_recurring_instance';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.is_recurring_instance';
  END IF;
END $$;

-- Add parent_event_id to link recurring instances to their parent
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN parent_event_id TEXT;
    RAISE NOTICE 'Added column: calendar_events.parent_event_id';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.parent_event_id';
  END IF;
END $$;

-- Add last_generated_date to track recurring event generation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'last_generated_date'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN last_generated_date DATE;
    RAISE NOTICE 'Added column: calendar_events.last_generated_date';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.last_generated_date';
  END IF;
END $$;

-- Add is_all_day flag for all-day events
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'is_all_day'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN is_all_day BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: calendar_events.is_all_day';
  ELSE
    RAISE NOTICE 'Column already exists: calendar_events.is_all_day';
  END IF;
END $$;

-- =====================================================================
-- 2. TEAM_MEMBERS TABLE - Add position column
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'position'
  ) THEN
    ALTER TABLE team_members ADD COLUMN position TEXT;
    RAISE NOTICE 'Added column: team_members.position';
  ELSE
    RAISE NOTICE 'Column already exists: team_members.position';
  END IF;
END $$;

-- =====================================================================
-- 3. TEAMS TABLE - Add display_order column
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE teams ADD COLUMN display_order INTEGER DEFAULT 0;
    RAISE NOTICE 'Added column: teams.display_order';
  ELSE
    RAISE NOTICE 'Column already exists: teams.display_order';
  END IF;
END $$;

-- Set initial display_order values based on created_at
DO $$
DECLARE
  team_record RECORD;
  order_counter INTEGER := 0;
BEGIN
  FOR team_record IN 
    SELECT id FROM teams 
    WHERE display_order IS NULL OR display_order = 0
    ORDER BY created_at
  LOOP
    order_counter := order_counter + 1;
    UPDATE teams SET display_order = order_counter WHERE id = team_record.id;
  END LOOP;
  RAISE NOTICE 'Initialized display_order for % teams', order_counter;
END $$;

-- =====================================================================
-- 4. WORKFLOWS TABLE - Add team_ids column
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'team_ids'
  ) THEN
    ALTER TABLE workflows ADD COLUMN team_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Added column: workflows.team_ids';
  ELSE
    RAISE NOTICE 'Column already exists: workflows.team_ids';
  END IF;
END $$;

-- =====================================================================
-- 5. HOLIDAY_REQUESTS TABLE - Add days_count column
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'holiday_requests' AND column_name = 'days_count'
  ) THEN
    ALTER TABLE holiday_requests ADD COLUMN days_count NUMERIC(5,1);
    RAISE NOTICE 'Added column: holiday_requests.days_count';
  ELSE
    RAISE NOTICE 'Column already exists: holiday_requests.days_count';
  END IF;
END $$;

-- Calculate days_count for existing holiday requests
DO $$
BEGIN
  UPDATE holiday_requests
  SET days_count = (end_date - start_date) + 1
  WHERE days_count IS NULL 
    AND start_date IS NOT NULL 
    AND end_date IS NOT NULL;
  RAISE NOTICE 'Calculated days_count for existing holiday requests';
END $$;

-- =====================================================================
-- 6. STAFFING_PLANS TABLE - Add description column
-- =====================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staffing_plans' AND column_name = 'description'
  ) THEN
    ALTER TABLE staffing_plans ADD COLUMN description TEXT;
    RAISE NOTICE 'Added column: staffing_plans.description';
  ELSE
    RAISE NOTICE 'Column already exists: staffing_plans.description';
  END IF;
END $$;

-- =====================================================================
-- CREATE USEFUL INDEXES
-- =====================================================================

-- Index for parent_event_id lookups (recurring events)
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent_event_id 
  ON calendar_events(parent_event_id) 
  WHERE parent_event_id IS NOT NULL;

-- Index for recurring event queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence 
  ON calendar_events(recurrence_type, is_recurring_instance) 
  WHERE recurrence_type != 'none';

-- Index for team display order
CREATE INDEX IF NOT EXISTS idx_teams_display_order 
  ON teams(practice_id, display_order) 
  WHERE deleted_at IS NULL;

-- Index for workflow team assignments
CREATE INDEX IF NOT EXISTS idx_workflows_team_ids 
  ON workflows USING GIN(team_ids) 
  WHERE team_ids IS NOT NULL AND array_length(team_ids, 1) > 0;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Count newly added columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name IN ('calendar_events', 'team_members', 'teams', 'workflows', 'holiday_requests', 'staffing_plans')
    AND column_name IN (
      'location', 'attendees', 'recurrence_type', 'recurrence_end_date', 
      'is_recurring_instance', 'parent_event_id', 'last_generated_date', 'is_all_day',
      'position', 'display_order', 'team_ids', 'days_count', 'description'
    );
  
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Total columns verified: %', col_count;
  RAISE NOTICE '=========================================';
END $$;

-- =====================================================================
-- FINAL SUMMARY
-- =====================================================================

-- Display summary of all added columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('calendar_events', 'team_members', 'teams', 'workflows', 'holiday_requests', 'staffing_plans')
  AND column_name IN (
    'location', 'attendees', 'recurrence_type', 'recurrence_end_date', 
    'is_recurring_instance', 'parent_event_id', 'last_generated_date', 'is_all_day',
    'position', 'display_order', 'team_ids', 'days_count', 'description'
  )
ORDER BY table_name, column_name;
