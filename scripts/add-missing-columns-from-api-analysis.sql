-- Migration: Add missing columns based on API usage analysis
-- Date: 2026-02-04
-- Description: Adds columns that are used in API routes but missing from database tables

-- ============================================================================
-- 1. calendar_events - Add missing recurrence and metadata columns
-- ============================================================================

DO $$ 
BEGIN
  -- location (TEXT) - Used in calendar-events POST/PUT API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN location TEXT;
    COMMENT ON COLUMN calendar_events.location IS 'Meeting location or URL';
  END IF;

  -- attendees (JSONB) - Used in calendar-events POST/PUT/GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'attendees'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN calendar_events.attendees IS 'List of event attendees';
  END IF;

  -- is_all_day (BOOLEAN) - Used in calendar-events POST/PUT/GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'is_all_day'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN is_all_day BOOLEAN DEFAULT false;
    COMMENT ON COLUMN calendar_events.is_all_day IS 'Indicates if event spans entire day';
  END IF;

  -- recurrence_type (TEXT) - Used in calendar-events POST/PUT/GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN recurrence_type TEXT DEFAULT 'none';
    COMMENT ON COLUMN calendar_events.recurrence_type IS 'Type of recurrence: none, daily, weekly, monthly, yearly';
  END IF;

  -- recurrence_end_date (DATE) - Used in calendar-events POST/PUT/GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN recurrence_end_date DATE;
    COMMENT ON COLUMN calendar_events.recurrence_end_date IS 'End date for recurring events';
  END IF;

  -- is_recurring_instance (BOOLEAN) - Used in calendar-events GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'is_recurring_instance'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN is_recurring_instance BOOLEAN DEFAULT false;
    COMMENT ON COLUMN calendar_events.is_recurring_instance IS 'Indicates if event is generated from recurring pattern';
  END IF;

  -- parent_event_id (TEXT) - Used in calendar-events GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN parent_event_id TEXT;
    COMMENT ON COLUMN calendar_events.parent_event_id IS 'Link to original recurring event';
  END IF;

  -- last_generated_date (DATE) - Used in calendar-events GET API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'last_generated_date'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN last_generated_date DATE;
    COMMENT ON COLUMN calendar_events.last_generated_date IS 'Last date instances were generated for recurring event';
  END IF;

END $$;

-- ============================================================================
-- 2. holiday_requests - Add days_count column
-- ============================================================================

DO $$ 
BEGIN
  -- days_count (NUMERIC) - Used in holiday-requests POST API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'holiday_requests' 
    AND column_name = 'days_count'
  ) THEN
    ALTER TABLE holiday_requests ADD COLUMN days_count NUMERIC DEFAULT 0;
    COMMENT ON COLUMN holiday_requests.days_count IS 'Number of working days in holiday request (excluding weekends)';
  END IF;
END $$;

-- ============================================================================
-- 3. staffing_plans - Add description column
-- ============================================================================

DO $$ 
BEGIN
  -- description (TEXT) - Used in staffing-plans POST API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staffing_plans' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE staffing_plans ADD COLUMN description TEXT;
    COMMENT ON COLUMN staffing_plans.description IS 'Detailed description of the staffing plan';
  END IF;
END $$;

-- ============================================================================
-- 4. workflows - Add team_ids column
-- ============================================================================

DO $$ 
BEGIN
  -- team_ids (TEXT[]) - Used in workflows GET/POST/PATCH API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'workflows' 
    AND column_name = 'team_ids'
  ) THEN
    ALTER TABLE workflows ADD COLUMN team_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
    COMMENT ON COLUMN workflows.team_ids IS 'Array of team IDs assigned to this workflow';
  END IF;
END $$;

-- ============================================================================
-- 5. teams - Add display_order column (for default_teams sync)
-- ============================================================================

DO $$ 
BEGIN
  -- display_order (INTEGER) - Used in teams API when syncing from default_teams
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teams' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE teams ADD COLUMN display_order INTEGER DEFAULT 0;
    COMMENT ON COLUMN teams.display_order IS 'Display order for UI sorting (synced from default_teams)';
    
    -- Update existing rows to use sort_order as display_order if available
    UPDATE teams SET display_order = COALESCE(sort_order, 0) WHERE display_order = 0;
  END IF;
END $$;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  - calendar_events: location, attendees, is_all_day, recurrence_type, recurrence_end_date, is_recurring_instance, parent_event_id, last_generated_date';
  RAISE NOTICE '  - holiday_requests: days_count';
  RAISE NOTICE '  - staffing_plans: description';
  RAISE NOTICE '  - workflows: team_ids';
  RAISE NOTICE '  - teams: display_order';
END $$;
