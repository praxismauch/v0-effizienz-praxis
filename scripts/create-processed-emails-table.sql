-- Create processed_emails table for IMAP email processor deduplication
-- Referenced by lib/email/imap-processor.ts

CREATE TABLE IF NOT EXISTS processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL,
  message_id TEXT NOT NULL,
  from_address TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  attachments_count INTEGER DEFAULT 0,
  documents_created INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(config_id, message_id)
);

-- Index for deduplication check (called on every email)
CREATE INDEX IF NOT EXISTS idx_processed_emails_config_message 
  ON processed_emails(config_id, message_id);

-- Index for cleanup/monitoring
CREATE INDEX IF NOT EXISTS idx_processed_emails_created_at 
  ON processed_emails(created_at);

-- Enable RLS
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;
