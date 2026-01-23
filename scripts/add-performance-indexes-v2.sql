-- Performance indexes for frequently queried columns
-- Only includes tables that exist in the database

-- Todos indexes
CREATE INDEX IF NOT EXISTS idx_todos_practice_id ON todos(practice_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_practice_id ON workflows(practice_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_practice_id ON documents(practice_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);

-- Document folders indexes
CREATE INDEX IF NOT EXISTS idx_document_folders_practice_id ON document_folders(practice_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_id ON document_folders(parent_id);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_practice_id ON goals(practice_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_by ON goals(created_by);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_practice_id ON calendar_events(practice_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);

-- Hiring candidates indexes
CREATE INDEX IF NOT EXISTS idx_hiring_candidates_practice_id ON hiring_candidates(practice_id);
CREATE INDEX IF NOT EXISTS idx_hiring_candidates_status ON hiring_candidates(status);
CREATE INDEX IF NOT EXISTS idx_hiring_candidates_stage ON hiring_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_hiring_candidates_job_posting_id ON hiring_candidates(job_posting_id);

-- Job postings indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_practice_id ON job_postings(practice_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_practice_id ON knowledge_base(practice_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_published ON knowledge_base(is_published);

-- User sidebar preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_sidebar_preferences_user_id ON user_sidebar_preferences(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_practice_id ON notifications(practice_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Time stamps indexes (for Zeiterfassung)
CREATE INDEX IF NOT EXISTS idx_time_stamps_user_id ON time_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_time_stamps_practice_id ON time_stamps(practice_id);
CREATE INDEX IF NOT EXISTS idx_time_stamps_timestamp ON time_stamps(timestamp);

-- Time blocks indexes
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_practice_id ON time_blocks(practice_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date);

-- Shift schedules indexes
CREATE INDEX IF NOT EXISTS idx_shift_schedules_team_member_id ON shift_schedules(team_member_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_practice_id ON shift_schedules(practice_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_shift_date ON shift_schedules(shift_date);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_practice_id ON contacts(practice_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_practice_id ON teams(practice_id);

-- Team assignments indexes
CREATE INDEX IF NOT EXISTS idx_team_assignments_practice_id ON team_assignments(practice_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_user_id ON team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team_id ON team_assignments(team_id);

-- Stripe subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_practice_id ON stripe_subscriptions(practice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);

-- Stripe customers indexes  
CREATE INDEX IF NOT EXISTS idx_stripe_customers_practice_id ON stripe_customers(practice_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_todos_practice_status ON todos(practice_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_practice_assigned ON todos(practice_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_practice_date ON calendar_events(practice_id, start_time);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
