-- Migration: Add deleted_at columns to tables that need soft delete support
-- Run this script in Supabase SQL Editor

-- Add deleted_at to todos table (if not exists)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to teams table (if not exists)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to team_assignments table (if not exists)
ALTER TABLE team_assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to knowledge_base table (if not exists)
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to workflows table (if not exists)
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to workflow_steps table (if not exists)
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to contacts table (if not exists)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to hiring_candidates table (if not exists)  
ALTER TABLE hiring_candidates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at to goals table (if not exists)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster soft delete queries
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_deleted_at ON knowledge_base(deleted_at);
CREATE INDEX IF NOT EXISTS idx_workflows_deleted_at ON workflows(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_hiring_candidates_deleted_at ON hiring_candidates(deleted_at);
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON goals(deleted_at);

-- Verify columns were added
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'deleted_at' 
AND table_schema = 'public'
ORDER BY table_name;
