CREATE TABLE IF NOT EXISTS practice_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO practice_forms (value, label, display_order, is_active) VALUES
  ('einzelpraxis', 'Einzelpraxis', 1, true),
  ('bag', 'Berufsausübungsgemeinschaft (BAG)', 2, true),
  ('mvz', 'Medizinisches Versorgungszentrum (MVZ)', 3, true),
  ('praxisgemeinschaft', 'Praxisgemeinschaft', 4, true),
  ('facharzt', 'Facharztpraxis', 5, true),
  ('zahnarzt', 'Zahnarztpraxis', 6, true),
  ('other', 'Sonstige', 7, true)
ON CONFLICT (value) DO NOTHING;
