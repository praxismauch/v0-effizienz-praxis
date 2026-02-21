-- Create practice_forms table to store dynamic Praxisart options
CREATE TABLE IF NOT EXISTS practice_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default Praxisarten
INSERT INTO practice_forms (value, label, display_order, is_active) VALUES
  ('einzelpraxis', 'Einzelpraxis', 1, true),
  ('bag', 'Berufsausübungsgemeinschaft (BAG)', 2, true),
  ('mvz', 'Medizinisches Versorgungszentrum (MVZ)', 3, true),
  ('praxisgemeinschaft', 'Praxisgemeinschaft', 4, true),
  ('facharzt', 'Facharztpraxis', 5, true),
  ('zahnarzt', 'Zahnarztpraxis', 6, true),
  ('other', 'Sonstige', 7, true)
ON CONFLICT (value) DO NOTHING;

-- Enable RLS
ALTER TABLE practice_forms ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access for all users" ON practice_forms
  FOR SELECT USING (true);

-- Allow full access for service role (super admin)
CREATE POLICY "Allow full access for service role" ON practice_forms
  FOR ALL USING (true) WITH CHECK (true);
