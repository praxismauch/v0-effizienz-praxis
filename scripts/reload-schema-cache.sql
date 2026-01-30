-- Force PostgREST to reload the schema cache
-- This is necessary after creating new tables

NOTIFY pgrst, 'reload schema';
