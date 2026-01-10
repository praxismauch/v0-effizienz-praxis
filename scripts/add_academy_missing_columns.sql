-- Add missing columns to academy tables

-- 1. Add is_featured_on_landing to academy_courses
ALTER TABLE academy_courses
ADD COLUMN IF NOT EXISTS is_featured_on_landing BOOLEAN DEFAULT false;

-- 2. Add estimated_time to academy_lessons (in addition to estimated_minutes)
ALTER TABLE academy_lessons
ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- Update estimated_time from estimated_minutes where it's null
UPDATE academy_lessons
SET estimated_time = estimated_minutes
WHERE estimated_time IS NULL AND estimated_minutes IS NOT NULL;

-- 3. Add deleted_at to academy_quiz_options for soft deletes
ALTER TABLE academy_quiz_options
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_academy_quiz_options_deleted_at ON academy_quiz_options(deleted_at);

-- 4. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_academy_courses_practice_id ON academy_courses(practice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_academy_courses_published ON academy_courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_academy_courses_featured ON academy_courses(is_featured_on_landing) WHERE deleted_at IS NULL;
