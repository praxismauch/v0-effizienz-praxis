-- Create surveys table if it doesn't exist
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id INTEGER NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  survey_type VARCHAR(50) DEFAULT 'internal',
  target_audience VARCHAR(50) DEFAULT 'all',
  is_anonymous BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  public_token VARCHAR(64),
  status VARCHAR(50) DEFAULT 'draft',
  response_count INTEGER DEFAULT 0,
  notify_admin_on_response BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create survey_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]',
  min_value INTEGER,
  max_value INTEGER,
  scale_labels JSONB,
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID,
  is_anonymous BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create survey_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_value INTEGER,
  answer_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  questions JSONB DEFAULT '[]',
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_surveys_practice_id ON surveys(practice_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_public_token ON surveys(public_token);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_response_id ON survey_answers(response_id);

-- Enable RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Allow all on surveys" ON surveys;
CREATE POLICY "Allow all on surveys" ON surveys FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on survey_questions" ON survey_questions;
CREATE POLICY "Allow all on survey_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on survey_responses" ON survey_responses;
CREATE POLICY "Allow all on survey_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on survey_answers" ON survey_answers;
CREATE POLICY "Allow all on survey_answers" ON survey_answers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on survey_templates" ON survey_templates;
CREATE POLICY "Allow all on survey_templates" ON survey_templates FOR ALL USING (true) WITH CHECK (true);

-- Insert some default templates
INSERT INTO survey_templates (name, description, category, questions, is_system_template, is_active)
VALUES 
  ('Mitarbeiterzufriedenheit', 'Umfrage zur allgemeinen Mitarbeiterzufriedenheit', 'employee', '[{"question_text": "Wie zufrieden sind Sie insgesamt mit Ihrer Arbeit?", "question_type": "scale", "is_required": true, "order_index": 1}, {"question_text": "Wie bewerten Sie die Zusammenarbeit im Team?", "question_type": "scale", "is_required": true, "order_index": 2}, {"question_text": "Was gefällt Ihnen besonders an Ihrer Arbeit?", "question_type": "text", "is_required": false, "order_index": 3}]', true, true),
  ('Patientenfeedback', 'Feedback-Umfrage für Patienten', 'patient', '[{"question_text": "Wie zufrieden waren Sie mit Ihrem Besuch?", "question_type": "scale", "is_required": true, "order_index": 1}, {"question_text": "Wie bewerten Sie die Freundlichkeit des Personals?", "question_type": "scale", "is_required": true, "order_index": 2}, {"question_text": "Würden Sie uns weiterempfehlen?", "question_type": "yes_no", "is_required": true, "order_index": 3}]', true, true),
  ('Arbeitsbelastung', 'Umfrage zur aktuellen Arbeitsbelastung', 'workload', '[{"question_text": "Wie hoch ist Ihre aktuelle Arbeitsbelastung?", "question_type": "scale", "is_required": true, "order_index": 1}, {"question_text": "Haben Sie ausreichend Zeit für Ihre Aufgaben?", "question_type": "yes_no", "is_required": true, "order_index": 2}, {"question_text": "Was würde Ihre Arbeitsbelastung reduzieren?", "question_type": "text", "is_required": false, "order_index": 3}]', true, true)
ON CONFLICT DO NOTHING;
