-- Create system_settings table for storing system-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings (super admin only)
CREATE POLICY "Super admins can view all system settings"
  ON system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid()
      AND (u.role = 'super_admin' OR au.email IN (
        SELECT email FROM auth.users WHERE id IN (
          SELECT id FROM users WHERE role = 'super_admin'
        )
      ))
    )
  );

CREATE POLICY "Super admins can insert system settings"
  ON system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid()
      AND (u.role = 'super_admin' OR au.email IN (
        SELECT email FROM auth.users WHERE id IN (
          SELECT id FROM users WHERE role = 'super_admin'
        )
      ))
    )
  );

CREATE POLICY "Super admins can update system settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid()
      AND (u.role = 'super_admin' OR au.email IN (
        SELECT email FROM auth.users WHERE id IN (
          SELECT id FROM users WHERE role = 'super_admin'
        )
      ))
    )
  );

CREATE POLICY "Super admins can delete system settings"
  ON system_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid()
      AND (u.role = 'super_admin' OR au.email IN (
        SELECT email FROM auth.users WHERE id IN (
          SELECT id FROM users WHERE role = 'super_admin'
        )
      ))
    )
  );
