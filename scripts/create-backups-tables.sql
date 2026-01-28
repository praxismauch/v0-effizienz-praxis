-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  backup_scope VARCHAR(50) NOT NULL DEFAULT 'full',
  file_url TEXT NOT NULL,
  file_size BIGINT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  tables_included TEXT[],
  metadata JSONB,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backup_schedules table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL,
  backup_scope VARCHAR(50) NOT NULL DEFAULT 'full',
  time_of_day TIME,
  day_of_week INTEGER,
  day_of_month INTEGER,
  retention_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_status VARCHAR(50),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_backups_practice_id ON backups(practice_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_practice_id ON backup_schedules(practice_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for backups
CREATE POLICY "Super admins can view all backups"
  ON backups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can insert backups"
  ON backups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can update backups"
  ON backups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can delete backups"
  ON backups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

-- RLS policies for backup_schedules
CREATE POLICY "Super admins can view all backup schedules"
  ON backup_schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can insert backup schedules"
  ON backup_schedules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can update backup schedules"
  ON backup_schedules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "Super admins can delete backup schedules"
  ON backup_schedules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));
