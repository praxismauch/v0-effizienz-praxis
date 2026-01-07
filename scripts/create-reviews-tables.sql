-- Create Google ratings table
CREATE TABLE IF NOT EXISTS google_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date DATE,
  response_text TEXT,
  response_date DATE,
  google_review_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Jameda ratings table
CREATE TABLE IF NOT EXISTS jameda_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date DATE,
  response_text TEXT,
  response_date DATE,
  jameda_review_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create Sanego ratings table
CREATE TABLE IF NOT EXISTS sanego_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date DATE,
  response_text TEXT,
  response_date DATE,
  sanego_review_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_google_ratings_practice_id ON google_ratings(practice_id);
CREATE INDEX IF NOT EXISTS idx_google_ratings_review_date ON google_ratings(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_jameda_ratings_practice_id ON jameda_ratings(practice_id);
CREATE INDEX IF NOT EXISTS idx_jameda_ratings_review_date ON jameda_ratings(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_sanego_ratings_practice_id ON sanego_ratings(practice_id);
CREATE INDEX IF NOT EXISTS idx_sanego_ratings_review_date ON sanego_ratings(review_date DESC);

-- Enable RLS
ALTER TABLE google_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jameda_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanego_ratings ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies
DROP POLICY IF EXISTS "Allow all on google_ratings" ON google_ratings;
CREATE POLICY "Allow all on google_ratings" ON google_ratings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on jameda_ratings" ON jameda_ratings;
CREATE POLICY "Allow all on jameda_ratings" ON jameda_ratings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on sanego_ratings" ON sanego_ratings;
CREATE POLICY "Allow all on sanego_ratings" ON sanego_ratings FOR ALL USING (true) WITH CHECK (true);
