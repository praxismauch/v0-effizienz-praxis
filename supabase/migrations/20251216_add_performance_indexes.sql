-- Add performance indexes for frequently queried tables
-- This migration improves query performance across the application

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_practice_id ON calendar_events(practice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_practice_date ON calendar_events(practice_id, start_date) WHERE deleted_at IS NULL;

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_practice_id ON user_profiles(practice_id);

-- Tickets indexes (if tickets table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
    CREATE INDEX IF NOT EXISTS idx_tickets_practice_id ON tickets(practice_id) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tickets_practice_status ON tickets(practice_id, status) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Goals indexes (if goals table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'goals') THEN
    CREATE INDEX IF NOT EXISTS idx_goals_practice_id ON goals(practice_id) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_goals_created_by ON goals(created_by);
  END IF;
END $$;

-- Notifications indexes (if notifications table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_practice_id ON notifications(practice_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(user_id, read) WHERE read = false;
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
  END IF;
END $$;

-- Practices indexes
CREATE INDEX IF NOT EXISTS idx_practices_id ON practices(id);
CREATE INDEX IF NOT EXISTS idx_practices_name ON practices(name);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_practice_created ON calendar_events(practice_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_practice_email ON user_profiles(practice_id, email);
