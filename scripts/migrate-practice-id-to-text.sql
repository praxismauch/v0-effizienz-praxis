-- Migration: Standardize all practice_id columns to TEXT + add auto-generation
-- Safe: no FK constraints on outlier tables, max 25 rows each, data casts cleanly

-- 1. Add auto-generation default to practices.id
ALTER TABLE practices ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Drop indexes on outlier tables (must drop before type change)
DROP INDEX IF EXISTS idx_academy_courses_practice;
DROP INDEX IF EXISTS academy_enrollments_user_id_course_id_practice_id_key;
DROP INDEX IF EXISTS idx_academy_enrollments_practice_id;
DROP INDEX IF EXISTS idx_cirs_incidents_practice_id;
DROP INDEX IF EXISTS idx_user_self_checks_practice_id;

-- 3. Convert 9 INTEGER/UUID tables to TEXT
ALTER TABLE academy_badges ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_courses ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_enrollments ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_modules ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_quiz_options ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_quiz_questions ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE academy_quizzes ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE cirs_incidents ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;
ALTER TABLE user_self_checks ALTER COLUMN practice_id TYPE TEXT USING practice_id::TEXT;

-- 4. Recreate indexes
CREATE INDEX idx_academy_courses_practice ON academy_courses(practice_id);
CREATE UNIQUE INDEX academy_enrollments_user_id_course_id_practice_id_key 
  ON academy_enrollments(user_id, course_id, practice_id);
CREATE INDEX idx_academy_enrollments_practice_id ON academy_enrollments(practice_id);
CREATE INDEX idx_cirs_incidents_practice_id ON cirs_incidents(practice_id);
CREATE INDEX idx_user_self_checks_practice_id ON user_self_checks(practice_id);
