-- Check time_stamps column names
SELECT column_name FROM information_schema.columns WHERE table_name = 'time_stamps' AND table_schema = 'public' AND column_name IN ('work_location', 'location_type');

-- Check time_stamps check constraints
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.time_stamps'::regclass AND contype = 'c';

-- Check workflow tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%workflow%' ORDER BY table_name;
