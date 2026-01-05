-- ✅ PRESERVES 100% EXISTING BUSINESS LOGIC
-- Performance indexes for effizienz-praxis.de
-- Safe to run - uses CONCURRENTLY (no downtime)

-- Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications(user_id, is_read) 
WHERE is_read = false;

-- Tickets table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_practice_id_status 
ON tickets(practice_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_practice_id_priority 
ON tickets(practice_id, priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_id_created_at 
ON tickets(user_id, created_at DESC);

-- Todos table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_practice_id_completed 
ON todos(practice_id, completed) 
WHERE completed = false;

-- Goals table indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_practice_id_status 
ON goals(practice_id, status) 
WHERE status NOT IN ('completed', 'cancelled');

-- Workflows table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_practice_id_status 
ON workflows(practice_id, status) 
WHERE status = 'active';

-- Candidates table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_practice_id_status 
ON candidates(practice_id, status) 
WHERE status != 'Archiv';

-- Team members table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_practice_id_status 
ON team_members(practice_id, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_id 
ON team_members(user_id);

-- Users table indexes (for joins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_practice_id 
ON users(practice_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_practice_status_priority 
ON tickets(practice_id, status, priority);

-- Analyze tables to update statistics
ANALYZE notifications;
ANALYZE tickets;
ANALYZE todos;
ANALYZE goals;
ANALYZE workflows;
ANALYZE candidates;
ANALYZE team_members;
ANALYZE users;
