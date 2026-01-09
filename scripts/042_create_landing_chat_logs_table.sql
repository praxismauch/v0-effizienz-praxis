-- Create landing chat logs table to store all chatbot questions and responses
CREATE TABLE IF NOT EXISTS landing_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question and response
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  matched_faq_key TEXT, -- Which FAQ was matched (null if default response)
  
  -- Session tracking
  session_id TEXT, -- Browser session ID for grouping conversations
  
  -- Visitor info (anonymized)
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  
  -- Analytics
  response_time_ms INTEGER, -- How long the response took
  is_default_response BOOLEAN DEFAULT false, -- Was it the fallback response?
  is_greeting BOOLEAN DEFAULT false, -- Was it a greeting?
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_landing_chat_logs_created_at ON landing_chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_chat_logs_matched_faq ON landing_chat_logs(matched_faq_key);
CREATE INDEX IF NOT EXISTS idx_landing_chat_logs_session ON landing_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_landing_chat_logs_default ON landing_chat_logs(is_default_response);

-- Comment
COMMENT ON TABLE landing_chat_logs IS 'Stores all landing page chatbot interactions for analytics';
