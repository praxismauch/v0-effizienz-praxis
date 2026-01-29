-- Create ai_training_files table for storing AI training file metadata
CREATE TABLE IF NOT EXISTS ai_training_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  uploaded_by UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_training_files_status ON ai_training_files(status);
CREATE INDEX IF NOT EXISTS idx_ai_training_files_category ON ai_training_files(category);
CREATE INDEX IF NOT EXISTS idx_ai_training_files_created_at ON ai_training_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_training_files_uploaded_by ON ai_training_files(uploaded_by);

-- Note: RLS policies will be added after the users table is confirmed to exist
